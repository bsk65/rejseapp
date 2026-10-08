import { useEffect, useState } from 'react'
import { fetchDkkRates } from '../api/exchangeRates'
import { useT } from '../i18n/useT'
import type { Price } from '../types/price'
import { CURRENCIES, formatMoney, parseAmount, toDkk } from '../utils/money'
import styles from './PriceField.module.css'

/** Sidst valgte valuta huskes på enheden — på en rejse er det oftest den samme. */
const CURRENCY_KEY = 'rejseappen_currency'

function lastCurrency(): string {
  try {
    return localStorage.getItem(CURRENCY_KEY) ?? 'DKK'
  } catch {
    return 'DKK'
  }
}

function rememberCurrency(currency: string): void {
  try {
    localStorage.setItem(CURRENCY_KEY, currency)
  } catch {
    // Privat vindue o.l. — så huskes den bare ikke.
  }
}

/**
 * Beløb + valuta til en booking. Et tomt beløb giver ingen pris. Et beløb, der
 * ikke kan læses, meldes via `onInvalidChange`, så formularen kan afvise at gemme.
 * Er valutaen fremmed, vises beløbet omregnet til kroner med dagens kurs.
 */
export function PriceField({
  id,
  price,
  onChange,
  onInvalidChange,
}: {
  id: string
  price?: Price
  onChange: (price: Price | undefined) => void
  onInvalidChange: (invalid: boolean) => void
}) {
  const { t, locale } = useT()
  const [text, setText] = useState(() =>
    price ? price.amount.toLocaleString(locale, { useGrouping: false }) : '',
  )
  const [currency, setCurrency] = useState(() => price?.currency ?? lastCurrency())
  const [approxDkk, setApproxDkk] = useState<number | undefined>(undefined)
  const amount = parseAmount(text)
  const invalid = text.trim() !== '' && amount === undefined

  useEffect(() => {
    onInvalidChange(invalid)
  }, [invalid, onInvalidChange])

  // Omregning til visning — kun når valutaen er fremmed og der er et beløb.
  useEffect(() => {
    if (amount === undefined || currency === 'DKK') return
    let cancelled = false
    fetchDkkRates()
      .then((rates) => {
        if (!cancelled) setApproxDkk(toDkk(amount, currency, rates))
      })
      .catch(() => {
        if (!cancelled) setApproxDkk(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [amount, currency])

  function update(nextText: string, nextCurrency: string) {
    setText(nextText)
    setCurrency(nextCurrency)
    const nextAmount = parseAmount(nextText)
    onChange(nextAmount === undefined ? undefined : { amount: nextAmount, currency: nextCurrency })
  }

  // En gemt valuta, der ikke står i listen, skal stadig kunne vises.
  const options = CURRENCIES.includes(currency as (typeof CURRENCIES)[number])
    ? CURRENCIES
    : [currency, ...CURRENCIES]
  const showApprox = amount !== undefined && currency !== 'DKK' && approxDkk !== undefined

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={id}>
        {t('costs.price')}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          className={styles.amount}
          inputMode="decimal"
          autoComplete="off"
          placeholder={t('costs.amountPlaceholder')}
          value={text}
          onChange={(e) => update(e.target.value, currency)}
        />
        <select
          className={styles.currency}
          aria-label={t('costs.currency')}
          value={currency}
          onChange={(e) => {
            rememberCurrency(e.target.value)
            update(text, e.target.value)
          }}
        >
          {options.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      {invalid && <p className={styles.error}>{t('costs.amountInvalid')}</p>}
      {showApprox && (
        <p className={styles.hint}>
          {t('costs.approxDkk', { amount: formatMoney(approxDkk, 'DKK', locale) })}
        </p>
      )}
    </div>
  )
}
