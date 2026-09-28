import { clockTime, formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import type { Ticket } from '../logic/tickets'
import { transportModeLabel } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './TicketCard.module.css'

export function TicketCard({ ticket, onSelect }: { ticket: Ticket; onSelect: () => void }) {
  const { segment } = ticket
  const title = [segment.carrier, segment.number].filter(Boolean).join(' ')
  const arrival = clockTime(segment.arrivalTime)
  const extras = [
    segment.terminal && `Terminal ${segment.terminal}`,
    segment.seat && `Plads ${segment.seat}`,
  ].filter(Boolean)

  return (
    <button
      type="button"
      className={styles.card}
      data-day-color={dayColorIndex(ticket.dayNumber)}
      onClick={onSelect}
    >
      <div className={styles.top}>
        <span className={styles.time}>{ticket.time ?? '--:--'}</span>
        <span className={styles.mode}>
          <TransportModeIcon mode={segment.mode} />
          {title || transportModeLabel[segment.mode]}
        </span>
      </div>

      <p className={styles.route}>
        {segment.departurePlace?.name ?? 'Fra ?'} → {segment.arrivalPlace?.name ?? 'Til ?'}
        {arrival && <span className={styles.muted}> · ankomst {arrival}</span>}
      </p>

      <p className={styles.meta}>
        <span className={styles.day}>Dag {ticket.dayNumber}</span> · {formatDayDate(ticket.date)}
        {extras.length > 0 && ` · ${extras.join(' · ')}`}
      </p>

      <div className={styles.bottom}>
        {segment.bookingRef ? (
          <span className={styles.booking}>{segment.bookingRef}</span>
        ) : (
          <span className={styles.muted}>Intet bookingnummer</span>
        )}
        <span className={styles.status} data-confirmed={segment.status === 'bekræftet'}>
          {segment.status === 'bekræftet' ? 'Bekræftet' : 'Ikke bekræftet'}
        </span>
      </div>
    </button>
  )
}
