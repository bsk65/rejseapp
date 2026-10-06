import { useT } from '../../../shared/i18n/useT'
import { BedIcon } from '../../stays/components/BedIcon'
import { transportModeLabel, type TransportMode } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './TicketsView.module.css'

export type TicketFilter = TransportMode | 'overnatning' | 'reservation' | 'alle'

/** Filter-knapper i "Billetter & tider" — vises kun, når der er mere end én slags. */
export function TicketFilters({
  modes,
  hasStays,
  hasReservations,
  active,
  onChange,
}: {
  modes: TransportMode[]
  hasStays: boolean
  hasReservations: boolean
  active: TicketFilter
  onChange: (filter: TicketFilter) => void
}) {
  const { t } = useT()
  if (modes.length + (hasStays ? 1 : 0) + (hasReservations ? 1 : 0) < 2) return null

  return (
    <div className={styles.filters}>
      <button
        type="button"
        className={styles.chip}
        data-active={active === 'alle'}
        onClick={() => onChange('alle')}
      >
        {t('segments.filterAll')}
      </button>
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          className={styles.chip}
          data-active={active === mode}
          onClick={() => onChange(mode)}
        >
          <TransportModeIcon mode={mode} />
          {t(transportModeLabel[mode])}
        </button>
      ))}
      {hasStays && (
        <button
          type="button"
          className={styles.chip}
          data-active={active === 'overnatning'}
          onClick={() => onChange('overnatning')}
        >
          <BedIcon />
          {t('segments.filterStays')}
        </button>
      )}
      {hasReservations && (
        <button
          type="button"
          className={styles.chip}
          data-active={active === 'reservation'}
          onClick={() => onChange('reservation')}
        >
          <span aria-hidden="true">🍽️</span>
          {t('reservations.filter')}
        </button>
      )}
    </div>
  )
}
