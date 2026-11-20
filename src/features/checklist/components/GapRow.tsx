import { useT } from '../../../shared/i18n/useT'
import { usePeople } from '../../friends/hooks/usePeople'
import { concernsEveryone } from '../logic/findGaps'
import { describeGap } from '../logic/describeGap'
import type { Gap } from '../types'
import styles from './TripChecklist.module.css'

/**
 * Én linje i "Mangler": tryk på linjen går til dagen. På delte rejser står der,
 * hvem hullet gælder, hvis det ikke er alle. `actionLabel` er "Det er OK" eller "Fortryd".
 */
export function GapRow({
  gap,
  travelerUids,
  muted = false,
  actionLabel,
  onShowDay,
  onAction,
}: {
  gap: Gap
  travelerUids: string[]
  muted?: boolean
  actionLabel?: string
  onShowDay: (dayId: string) => void
  onAction?: () => void
}) {
  const { t, locale } = useT()
  const { selfUid, nameOf } = usePeople()
  const { title, detail } = describeGap(gap, t, locale)
  const names = gap.people.map((uid) => (uid === selfUid ? t('people.you') : nameOf(uid)))
  const showWho = travelerUids.length > 1 && !concernsEveryone(gap, travelerUids)

  return (
    <li className={styles.row} data-muted={muted}>
      <button type="button" className={styles.rowMain} onClick={() => onShowDay(gap.dayId)}>
        <span className={styles.rowTitle}>{title}</span>
        <span className={styles.rowDetail}>{detail}</span>
        {showWho && (
          <span className={styles.who}>{t('checklist.only', { names: names.join(', ') })}</span>
        )}
      </button>
      {actionLabel && onAction && (
        <button
          type="button"
          className={styles.okButton}
          aria-label={
            muted
              ? `${actionLabel}: ${title}`
              : t('checklist.markOkLabel', { text: detail, day: title })
          }
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </li>
  )
}
