import { useState } from 'react'
import { useNow } from '../../../shared/hooks/useNow'
import type { Day } from '../../days/types'
import { useTripSegments } from '../hooks/useTripSegments'
import {
  buildTickets,
  findNextDeparture,
  formatCountdown,
  TICKET_MODES,
  type Ticket,
} from '../logic/tickets'
import { transportModeLabel, type TransportMode } from '../types'
import { SegmentDetailForm } from './SegmentDetailForm'
import { TicketCard } from './TicketCard'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './TicketsView.module.css'

export function TicketsView({
  tripId,
  days,
  userUid,
}: {
  tripId: string
  days: Day[]
  userUid: string
}) {
  const { entries } = useTripSegments(tripId, days, userUid)
  const now = useNow()
  const [filter, setFilter] = useState<TransportMode | 'alle'>('alle')
  const [editing, setEditing] = useState<Ticket | null>(null)

  const allTickets = buildTickets(entries, 'alle')
  const tickets = buildTickets(entries, filter)
  const next = findNextDeparture(tickets, now)
  const presentModes = TICKET_MODES.filter((mode) =>
    allTickets.some((t) => t.segment.mode === mode),
  )

  if (allTickets.length === 0) {
    return (
      <p className={styles.empty}>
        Ingen fly, tog, busser eller færger endnu. Tilføj dem under de enkelte dage på fanen “Dage”
        — så samles de her i tidsorden.
      </p>
    )
  }

  return (
    <div className={styles.view}>
      {presentModes.length > 1 && (
        <div className={styles.filters}>
          <button
            type="button"
            className={styles.chip}
            data-active={filter === 'alle'}
            onClick={() => setFilter('alle')}
          >
            Alle
          </button>
          {presentModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={styles.chip}
              data-active={filter === mode}
              onClick={() => setFilter(mode)}
            >
              <TransportModeIcon mode={mode} />
              {transportModeLabel[mode]}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <SegmentDetailForm
          tripId={tripId}
          dayId={editing.dayId}
          segment={editing.segment}
          onClose={() => setEditing(null)}
        />
      )}

      {next?.departsAt && (
        <section className={styles.next}>
          <p className={styles.nextLabel}>
            Næste afgang · <strong>{formatCountdown(next.departsAt, now)}</strong>
          </p>
          <TicketCard ticket={next} onSelect={() => setEditing(next)} />
        </section>
      )}

      <ul className={styles.list}>
        {tickets
          .filter((ticket) => ticket !== next)
          .map((ticket) => (
            <li
              key={ticket.segment.id}
              className={styles.item}
              data-past={Boolean(ticket.departsAt && new Date(ticket.departsAt) < now)}
            >
              <TicketCard ticket={ticket} onSelect={() => setEditing(ticket)} />
            </li>
          ))}
      </ul>
    </div>
  )
}
