import { useT } from '../i18n/useT'
import type { PriceFor } from '../types/price'
import styles from './PriceForChoice.module.css'

/**
 * Er prisen for alle de rejsende tilsammen eller pr. person? Vises kun, når
 * flere rejser med — og skal vælges aktivt (ingen standard), så man ikke
 * kommer til at tælle en fælles billet dobbelt eller en privat kun én gang.
 */
export function PriceForChoice({
  travelerCount,
  value,
  onChange,
}: {
  travelerCount: number
  value?: PriceFor
  onChange: (value: PriceFor) => void
}) {
  const { t } = useT()
  const options: { id: PriceFor; label: string }[] = [
    { id: 'alle', label: t('costs.priceForAll', { count: travelerCount }) },
    { id: 'person', label: t('costs.priceForPerson', { count: travelerCount }) },
  ]
  return (
    <fieldset className={styles.choice} data-missing={!value}>
      <legend className={styles.legend}>{t('costs.priceForLegend')}</legend>
      {options.map((option) => (
        <label key={option.id} className={styles.row}>
          <input
            type="radio"
            name="price-for"
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          {option.label}
        </label>
      ))}
      {!value && <p className={styles.required}>{t('costs.priceForRequired')}</p>}
    </fieldset>
  )
}
