import { useMemo } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { formatDayDate } from '../../../shared/utils/date'
import { formatMoney } from '../../../shared/utils/money'
import type { Day } from '../../days/types'
import type { Reservation } from '../../reservations/types'
import { useTripSegments } from '../../segments/hooks/useTripSegments'
import type { Stay } from '../../stays/types'
import { useTodayRates } from '../hooks/useTodayRates'
import { costSources } from '../logic/costSources'
import { buildCostSummary, needsRates } from '../logic/costSummary'
import { costCategoryIcon, costCategoryLabel, type CostItem } from '../types'
import styles from './TripCosts.module.css'

/** "Rejsens pris": alle bookingers priser pr. kategori med subtotal og samlet total i kroner. */
export function TripCosts({
  tripId,
  days,
  stays,
  reservations,
  userUid,
  onClose,
}: {
  tripId: string
  days: Day[]
  stays: Stay[]
  reservations: Reservation[]
  userUid: string
  onClose: () => void
}) {
  const { t, locale } = useT()
  const { entries } = useTripSegments(tripId, days, userUid)
  const sources = useMemo(
    () => costSources(entries, stays, reservations, t),
    [entries, stays, reservations, t],
  )
  const rates = useTodayRates(needsRates(sources))
  const summary = buildCostSummary(sources, rates)
  const kr = (amount: number) => formatMoney(amount, 'DKK', locale)

  function itemAmount(item: CostItem) {
    const one = formatMoney(item.price.amount, item.price.currency, locale)
    const original =
      item.quantity > 1 ? t('costs.perPerson', { count: item.quantity, amount: one }) : one
    if (item.dkk === undefined) return original
    if (item.price.currency === 'DKK') {
      return item.quantity > 1 ? `${original} = ${kr(item.dkk)}` : original
    }
    const rateNote = item.todayRate ? ` (${t('costs.todayRate')})` : ''
    return `${original} ≈ ${kr(item.dkk)}${rateNote}`
  }

  return (
    <div className={styles.panel}>
      <p className={styles.title}>{t('costs.title')}</p>

      {summary.groups.length === 0 ? (
        <p className={styles.note}>{t('costs.empty')}</p>
      ) : (
        <>
          {summary.groups.map((group) => (
            <section key={group.category} className={styles.group}>
              <div className={styles.groupHeader}>
                <span>
                  <span aria-hidden="true">{costCategoryIcon[group.category]}</span>{' '}
                  {t(costCategoryLabel[group.category])}
                </span>
                <span>{kr(group.totalDkk)}</span>
              </div>
              <ul className={styles.items}>
                {group.items.map((item) => (
                  <li key={item.key} className={styles.item}>
                    <span className={styles.itemLabel}>
                      {item.label}
                      {item.includes && (
                        <span className={styles.itemDate}>
                          {t('costs.includes', { list: item.includes.join(', ') })}
                        </span>
                      )}
                      {item.date && (
                        <span className={styles.itemDate}>{formatDayDate(item.date, locale)}</span>
                      )}
                    </span>
                    <span className={styles.itemAmount} data-unconverted={item.dkk === undefined}>
                      {itemAmount(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <div className={styles.total}>
            <span>{t('costs.total')}</span>
            <span>{kr(summary.totalDkk)}</span>
          </div>
        </>
      )}

      {summary.missingCount > 0 && (
        <p className={styles.note}>
          {summary.missingCount === 1
            ? t('costs.missingOne')
            : t('costs.missing', { count: summary.missingCount })}
        </p>
      )}
      {summary.unconvertedCount > 0 && <p className={styles.note}>{t('costs.unconverted')}</p>}
      {summary.hasForeign && <p className={styles.note}>{t('costs.rateNote')}</p>}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </div>
  )
}
