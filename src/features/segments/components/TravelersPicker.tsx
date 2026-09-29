import { useT } from '../../../shared/i18n/useT'
import { usePeople } from '../../friends/hooks/usePeople'
import { toggleTraveler } from '../logic/travelers'
import styles from './TravelersPicker.module.css'

/** "Hvem er med?" i transportens formular — kun på delte rejser. */
export function TravelersPicker({
  travelers,
  onChange,
}: {
  travelers: string[]
  onChange: (travelers: string[]) => void
}) {
  const { t } = useT()
  const { shared, memberUids, selfUid, nameOf } = usePeople()
  if (!shared) return null

  // Én selv først, så de andre i den rækkefølge, de blev tilføjet til rejsen.
  const ordered = [selfUid, ...memberUids.filter((uid) => uid !== selfUid)]
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{t('people.travelers')}</legend>
      {ordered.map((uid) => (
        <label key={uid} className={styles.row}>
          <input
            type="checkbox"
            checked={travelers.includes(uid)}
            // Den sidste kan ikke fjernes — nogen skal være med.
            disabled={travelers.length === 1 && travelers[0] === uid}
            onChange={() => onChange(toggleTraveler(travelers, uid))}
          />
          {uid === selfUid ? t('people.you') : nameOf(uid)}
        </label>
      ))}
    </fieldset>
  )
}
