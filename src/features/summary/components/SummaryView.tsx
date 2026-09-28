import { useMemo } from 'react'
import type { Day } from '../../days/types'
import type { Photo } from '../../photos/types'
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
}: {
  tripId: string
  userUid: string
  dayCount: number
  days: Day[]
  photos: Photo[]
}) {
  const { points, error } = useTrack(tripId, userUid)
  const stops = useMemo(() => buildJourney(days, points, photos), [days, points, photos])
  const totalKm = useMemo(() => {
    const { cumulativeKm } = buildTimeline(stops)
    return cumulativeKm[cumulativeKm.length - 1]
  }, [stops])
  const photoCount = stops.filter((stop) => stop.kind === 'foto').length
  const checkInCount = stops.filter((stop) => stop.kind === 'checkin').length

  return (
    <div className={styles.view}>
      <dl className={styles.stats}>
        <Stat label="Dage" value={String(dayCount)} />
        <Stat label="Tilbagelagt" value={formatKm(totalKm)} />
        <Stat label="Billeder på kortet" value={String(photoCount)} />
        <Stat label="Check-ins" value={String(checkInCount)} />
      </dl>

      {error && <p className={styles.error}>{error}</p>}

      {stops.length < 2 ? (
        <p className={styles.empty}>
          Der er endnu ikke nok at afspille. Tilføj Fra/Til-steder på dagene, spor turen, eller
          upload billeder med GPS-position — så kan hele rejsen afspilles her.
        </p>
      ) : (
        <JourneyPlayer stops={stops} days={days} />
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
