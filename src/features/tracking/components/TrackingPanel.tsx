import { useCallback, useState } from 'react'
import type { Message } from '../../../shared/i18n/message'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { PlaceSearchInput } from '../../../shared/ui/PlaceSearchInput'
import { useCheckIn } from '../hooks/useCheckIn'
import { useGpsTracking } from '../hooks/useGpsTracking'
import { useRecordTrackPoint } from '../hooks/useRecordTrackPoint'
import type { GpsFix } from '../logic/shouldRecordPoint'
import { isRouteSource, type TrackPoint, type TrackingContext } from '../types'
import { CheckInList } from './CheckInList'
import { GpxImport } from './GpxImport'
import styles from './TrackingPanel.module.css'

export function TrackingPanel({
  context,
  points,
  loadError,
  selectedImportId,
  onSelectImport,
}: {
  context: TrackingContext
  points: TrackPoint[]
  loadError: Message | null
  selectedImportId: string | null
  onSelectImport: (importId: string) => void
}) {
  const { t } = useT()
  const { record, error: recordError } = useRecordTrackPoint(context)
  const recordGps = useCallback((fix: GpsFix) => record(fix, 'gps'), [record])
  const gps = useGpsTracking(recordGps)
  const checkIn = useCheckIn(record)
  const [searching, setSearching] = useState(false)

  const routePointCount = points.filter((p) => isRouteSource(p.source)).length
  const checkIns = points.filter((p) => p.source === 'manuel')
  const error = loadError ?? gps.error ?? checkIn.error ?? recordError

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.title}>{t('tracking.title')}</p>
        <p className={styles.meta}>{t('tracking.gpsPoints', { n: routePointCount })}</p>
      </div>

      {gps.active ? (
        <>
          <p className={styles.status}>
            <span className={styles.liveDot} />
            {gps.warmingUp
              ? t('tracking.warmingUp')
              : t('tracking.tracking', { n: gps.recordedCount })}
          </p>
          <p className={styles.hint}>{t('tracking.keepOpen')}</p>
          <Button type="button" variant="danger" onClick={gps.stop}>
            {t('tracking.stop')}
          </Button>
        </>
      ) : (
        <Button type="button" onClick={gps.start}>
          {t('tracking.start')}
        </Button>
      )}

      <div className={styles.checkInActions}>
        <Button
          type="button"
          variant="secondary"
          disabled={checkIn.pending}
          onClick={() => void checkIn.checkInHere()}
        >
          {checkIn.pending ? t('tracking.findingPosition') : t('tracking.checkInHere')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setSearching((s) => !s)}>
          {searching ? t('tracking.closeSearch') : t('tracking.checkInElsewhere')}
        </Button>
      </div>

      {searching && (
        <PlaceSearchInput
          label={t('tracking.whereAreYou')}
          onSelect={(place) => {
            setSearching(false)
            void checkIn.checkInAt(place)
          }}
        />
      )}

      {error && <p className={styles.error}>{t(error.key, error.params)}</p>}

      <CheckInList tripId={context.tripId} userUid={context.userUid} checkIns={checkIns} />

      <GpxImport
        context={context}
        points={points}
        selectedImportId={selectedImportId}
        onSelectImport={onSelectImport}
      />
    </section>
  )
}
