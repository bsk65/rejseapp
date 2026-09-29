import { useT } from '../../../shared/i18n/useT'
import { usePeople } from '../../friends/hooks/usePeople'
import { travelersLabel, travelersOf } from '../logic/travelers'
import type { Segment } from '../types'
import styles from './TravelersTag.module.css'

/** "👤 Dig" / "👥 Dig, Lars" / "👥 Alle" på et transportkort — kun på delte rejser. */
export function TravelersTag({ segment }: { segment: Segment }) {
  const { t } = useT()
  const { shared, memberUids, selfUid, nameOf } = usePeople()
  if (!shared) return null

  const travelers = travelersOf(segment)
  const label = travelersLabel(travelers, memberUids, selfUid, nameOf, {
    everyone: t('people.everyone'),
    you: t('people.you'),
  })
  return (
    <span className={styles.tag} data-mine={travelers.includes(selfUid)}>
      <span aria-hidden="true">{travelers.length > 1 ? '👥' : '👤'}</span>
      {label}
    </span>
  )
}
