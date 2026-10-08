import { useT } from '../../../shared/i18n/useT'
import { formatDayDate } from '../../../shared/utils/date'
import type { Day } from '../../days/types'
import { useTripSegments } from '../hooks/useTripSegments'
import { describeSegment } from '../logic/describeSegment'
import { coverCandidates, departureDate, toggleCovered } from '../logic/priceCovers'
import styles from './PriceCoversPicker.module.css'

/**
 * "Prisen dækker også": vælg de andre rejser, der er med i samme billet — f.eks.
 * alle flyvningerne ud og hjem på én bestilling.
 */
export function PriceCoversPicker({
  tripId,
  days,
  selfUid,
  segmentId,
  covered,
  onChange,
}: {
  tripId: string
  days: Day[]
  selfUid: string
  segmentId: string
  covered: string[]
  onChange: (covered: string[]) => void
}) {
  const { t, locale } = useT()
  const { entries } = useTripSegments(tripId, days, selfUid)
  const candidates = coverCandidates(entries, segmentId)
  if (candidates.length === 0) return null

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{t('costs.coversLegend')}</legend>
      <p className={styles.hint}>{t('costs.coversHint')}</p>
      {candidates.map((entry) => {
        const { segment } = entry
        const { title } = describeSegment(segment, t)
        const from = segment.departurePlace?.name
        const to = segment.arrivalPlace?.name
        return (
          <label key={segment.id} className={styles.row}>
            <input
              type="checkbox"
              checked={covered.includes(segment.id)}
              onChange={() => onChange(toggleCovered(covered, segment.id))}
            />
            <span className={styles.text}>
              <span>
                {title}
                {(from || to) && ` · ${from ?? '?'} → ${to ?? '?'}`}
              </span>
              <span className={styles.date}>{formatDayDate(departureDate(entry), locale)}</span>
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
