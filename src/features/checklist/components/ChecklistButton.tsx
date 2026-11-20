import { useT } from '../../../shared/i18n/useT'
import type { Day } from '../../days/types'
import type { Reservation } from '../../reservations/types'
import type { Stay } from '../../stays/types'
import { useTripGaps } from '../hooks/useTripGaps'
import styles from './ChecklistButton.module.css'

/** "✅ Mangler 5" i rejsens header — åbner/lukker oversigten. Antallet er det, der stadig mangler. */
export function ChecklistButton({
  tripId,
  days,
  stays,
  reservations,
  userUid,
  expanded,
  className,
  onClick,
}: {
  tripId: string
  days: Day[]
  stays: Stay[]
  reservations: Reservation[]
  userUid: string
  expanded: boolean
  className: string
  onClick: () => void
}) {
  const { t } = useT()
  const { openCount } = useTripGaps(tripId, days, stays, reservations, userUid)

  return (
    <button
      type="button"
      className={className}
      aria-label={t('checklist.buttonLabel')}
      aria-expanded={expanded}
      onClick={onClick}
    >
      <span aria-hidden="true">✅</span> {t('checklist.button')}
      {openCount > 0 && <span className={styles.badge}>{openCount}</span>}
    </button>
  )
}
