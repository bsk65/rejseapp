import { useMemo } from 'react'
import { useT } from '../../../shared/i18n/useT'
import type { Day } from '../../days/types'
import type { Photo } from '../../photos/types'
import type { Stay } from '../../stays/types'
import { useTripSegments } from '../../segments/hooks/useTripSegments'
import { buildLegs } from '../../segments/logic/legs'
import { useTrack } from '../../tracking/hooks/useTrack'
import { buildJourney } from '../logic/buildJourney'
import { buildTimeline } from '../logic/timeline'
import { formatKm } from '../logic/formatKm'
import { JourneyPlayer } from './JourneyPlayer'
import styles from './SummaryView.module.css'

/** Fanen "Afspil" (opsummering): nøgletal og en animeret afspilning af hele rejsen. */
export function SummaryView({
  tripId,
  userUid,
  dayCount,
  days,
  photos,
  stays,
}: {
  tripId: string
  userUid: string
  dayCount: number
  days: Day[]
  photos: Photo[]
  stays: Stay[]
}) {
  const { t, locale } = useT()
  const { points, error } = useTrack(tripId, userUid)
  const { entries } = useTripSegments(tripId, days, userUid)
  const legs = useMemo(() => buildLegs(entries), [entries])
  const stops = useMemo(
    () => buildJourney(days, points, photos, legs),
    [days, points, photos, legs],
  )
  const totalKm = useMemo(() => {
    const { cumulativeKm } = buildTimeline(stops)
    return cumulativeKm[cumulativeKm.length - 1]
  }, [stops])
  const photoCount = stops.filter((stop) => stop.kind === 'foto').length
  const checkInCount = stops.filter((stop) => stop.kind === 'checkin').length

  return (
    <div className={styles.view}>
      <dl className={styles.stats}>
        <Stat label={t('summary.statDays')} value={String(dayCount)} />
        <Stat label={t('summary.statDistance')} value={formatKm(totalKm, locale)} />
        <Stat label={t('summary.statPhotos')} value={String(photoCount)} />
        <Stat label={t('summary.statCheckIns')} value={String(checkInCount)} />
      </dl>

      {error && <p className={styles.error}>{t(error.key, error.params)}</p>}

      {stops.length < 2 ? (
        <p className={styles.empty}>{t('summary.notEnough')}</p>
      ) : (
        <JourneyPlayer stops={stops} days={days} stays={stays} />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue}>{value}</dd>
    </div>
  )
}
