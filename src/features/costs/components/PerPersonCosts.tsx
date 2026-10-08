import { useT } from '../../../shared/i18n/useT'
import { formatMoney } from '../../../shared/utils/money'
import { usePeople } from '../../friends/hooks/usePeople'
import styles from './TripCosts.module.css'

/**
 * "Pr. person": hvad rejsen koster hver enkelt — kun på delte rejser. Én selv
 * først, så de andre i den rækkefølge, de blev tilføjet (og til sidst evt.
 * nogen, der ikke længere er med på rejsen, men står på en booking).
 */
export function PerPersonCosts({ perPerson }: { perPerson: Record<string, number> }) {
  const { t, locale } = useT()
  const { shared, selfUid, memberUids, nameOf } = usePeople()
  if (!shared) return null

  const others = memberUids.filter((uid) => uid !== selfUid)
  const former = Object.keys(perPerson).filter((uid) => uid !== selfUid && !others.includes(uid))
  const ordered = [selfUid, ...others, ...former]

  return (
    <section className={styles.group}>
      <div className={styles.groupHeader}>
        <span>
          <span aria-hidden="true">👥</span> {t('costs.perPersonTitle')}
        </span>
      </div>
      <ul className={styles.items}>
        {ordered.map((uid) => (
          <li key={uid} className={styles.item}>
            <span className={styles.itemLabel}>
              {uid === selfUid ? t('people.you') : nameOf(uid)}
            </span>
            <span className={styles.itemAmount}>
              {formatMoney(perPerson[uid] ?? 0, 'DKK', locale)}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t('costs.perPersonNote')}</p>
    </section>
  )
}
