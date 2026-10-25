import { useMemo, useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import type { Day } from '../../days/types'
import { usePeople } from '../../friends/hooks/usePeople'
import type { Photo } from '../../photos/types'
import type { Stay } from '../../stays/types'
import { useTripSegments } from '../../segments/hooks/useTripSegments'
import { buildLegs } from '../../segments/logic/legs'
import { useTrack } from '../../tracking/hooks/useTrack'
import { buildJourney, onlyPerson, type JourneyPerson } from '../logic/buildJourney'
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
  const { shared, memberUids, nameOf } = usePeople()
  const { points, error } = useTrack(tripId, userUid)
  const { entries } = useTripSegments(tripId, days, userUid)

  // Hvis rejse der afspilles — på en delt rejse som udgangspunkt ens egen.
  const [person, setPerson] = useState<JourneyPerson>(shared ? userUid : 'alle')
  const personChoices: JourneyPerson[] = [
    userUid,
    ...memberUids.filter((uid) => uid !== userUid),
    'alle',
  ]

  const stops = useMemo(() => {
    const picked = onlyPerson(person, points, photos, entries)
    return buildJourney(days, picked.trackPoints, picked.photos, buildLegs(picked.entries))
  }, [days, points, photos, entries, person])
  const totalKm = useMemo(() => {
    const { cumulativeKm } = buildTimeline(stops)
    return cumulativeKm[cumulativeKm.length - 1]
  }, [stops])
  const photoCount = stops.filter((stop) => stop.kind === 'foto').length
  const checkInCount = stops.filter((stop) => stop.kind === 'checkin').length

  return (
    <div className={styles.view}>
      {shared && (
        <div className={styles.people}>
          {personChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={styles.chip}
              data-active={person === choice}
              onClick={() => setPerson(choice)}
            >
              {choice === 'alle'
                ? t('people.everyone')
                : choice === userUid
                  ? t('people.you')
                  : nameOf(choice)}
            </button>
          ))}
        </div>
      )}

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
        // key: afspilningen starter forfra, når man skifter person.
        <JourneyPlayer key={person} stops={stops} days={days} stays={stays} />
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
