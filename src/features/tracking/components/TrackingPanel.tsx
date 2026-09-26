import { useCallback, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { PlaceSearchInput } from '../../../shared/ui/PlaceSearchInput'
import { useCheckIn } from '../hooks/useCheckIn'
import { useGpsTracking } from '../hooks/useGpsTracking'
import { useRecordTrackPoint } from '../hooks/useRecordTrackPoint'
import type { GpsFix } from '../logic/shouldRecordPoint'
import type { TrackPoint, TrackingContext } from '../types'
import { CheckInList } from './CheckInList'
import styles from './TrackingPanel.module.css'

export function TrackingPanel({
  context,
  points,
}: {
  context: TrackingContext
  points: TrackPoint[]
}) {
  const { record, error: recordError } = useRecordTrackPoint(context)
  const recordGps = useCallback((fix: GpsFix) => record(fix, 'gps'), [record])
  const gps = useGpsTracking(recordGps)
  const checkIn = useCheckIn(record)
  const [searching, setSearching] = useState(false)

  const gpsPointCount = points.filter((p) => p.source === 'gps').length
  const checkIns = points.filter((p) => p.source === 'manuel')
  const error = gps.error ?? checkIn.error ?? recordError

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.title}>Sporing</p>
        <p className={styles.meta}>{gpsPointCount} GPS-punkter</p>
      </div>

      {gps.active ? (
        <>
          <p className={styles.status}>
            <span className={styles.liveDot} />
            Sporer din rute… {gps.recordedCount} punkter gemt
          </p>
          <p className={styles.hint}>
            Hold appen åben — sporingen stopper, hvis du lukker den eller skifter til en anden app.
          </p>
          <Button type="button" variant="danger" onClick={gps.stop}>
            Stop sporing
          </Button>
        </>
      ) : (
        <Button type="button" onClick={gps.start}>
          Start GPS-sporing
        </Button>
      )}

      <div className={styles.checkInActions}>
        <Button
          type="button"
          variant="secondary"
          disabled={checkIn.pending}
          onClick={() => void checkIn.checkInHere()}
        >
          {checkIn.pending ? 'Finder position…' : 'Check ind her'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setSearching((s) => !s)}>
          {searching ? 'Luk søgning' : 'Check ind et andet sted'}
        </Button>
      </div>

      {searching && (
        <PlaceSearchInput
          label="Hvor er du?"
          onSelect={(place) => {
            setSearching(false)
            void checkIn.checkInAt(place)
          }}
        />
      )}

      {error && <p className={styles.error}>{error}</p>}

      <CheckInList tripId={context.tripId} userUid={context.userUid} checkIns={checkIns} />
    </section>
  )
}
