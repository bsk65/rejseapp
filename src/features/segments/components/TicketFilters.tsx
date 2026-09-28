import { BedIcon } from '../../stays/components/BedIcon'
import { transportModeLabel, type TransportMode } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './TicketsView.module.css'

export type TicketFilter = TransportMode | 'overnatning' | 'alle'

/** Filter-knapper i "Billetter & tider" — vises kun, når der er mere end én slags. */
export function TicketFilters({
  modes,
  hasStays,
  active,
  onChange,
}: {
  modes: TransportMode[]
  hasStays: boolean
  active: TicketFilter
  onChange: (filter: TicketFilter) => void
}) {
  if (modes.length + (hasStays ? 1 : 0) < 2) return null

  return (
    <div className={styles.filters}>
      <button
        type="button"
        className={styles.chip}
        data-active={active === 'alle'}
        onClick={() => onChange('alle')}
      >
        Alle
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
          {transportModeLabel[mode]}
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
          Overnatning
        </button>
      )}
    </div>
  )
}
