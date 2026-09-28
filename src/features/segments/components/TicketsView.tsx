import { useState } from 'react'
import { useNow } from '../../../shared/hooks/useNow'
import type { Day } from '../../days/types'
import { StayForm } from '../../stays/components/StayForm'
import { StayMomentCard } from '../../stays/components/StayMomentCard'
import { stayMoments } from '../../stays/logic/stayDates'
import type { Stay } from '../../stays/types'
import { useTripSegments } from '../hooks/useTripSegments'
import {
  buildTicketTimeline,
  findNextItem,
  itemTime,
  type TimelineItem,
} from '../logic/ticketTimeline'
import { buildTickets, formatCountdown, TICKET_MODES, type Ticket } from '../logic/tickets'
import { BoardingPassScan } from './BoardingPassScan'
import { SegmentDetailForm } from './SegmentDetailForm'
import { TicketCard } from './TicketCard'
import { TicketFilters, type TicketFilter } from './TicketFilters'
import styles from './TicketsView.module.css'

export function TicketsView({
  tripId,
  days,
  stays,
  userUid,
  memberUids,
}: {
  tripId: string
  days: Day[]
  stays: Stay[]
  userUid: string
  memberUids: string[]
}) {
  const { entries } = useTripSegments(tripId, days, userUid)
  const now = useNow()
  const [filter, setFilter] = useState<TicketFilter>('alle')
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [editingStay, setEditingStay] = useState<Stay | null>(null)

  const allTickets = buildTickets(entries, 'alle')
  const tickets = filter === 'overnatning' ? [] : buildTickets(entries, filter)
  const moments = filter === 'alle' || filter === 'overnatning' ? stayMoments(stays) : []
  const items = buildTicketTimeline(tickets, moments)
  const next = findNextItem(items, now)
  const nextTime = next && itemTime(next)
  const presentModes = TICKET_MODES.filter((mode) =>
    allTickets.some((t) => t.segment.mode === mode),
  )
  const dayNumberOf = (date: string) => days.find((day) => day.date === date)?.dayNumber

  function renderItem(item: TimelineItem) {
    if (item.kind === 'ticket') {
      return <TicketCard ticket={item.ticket} onSelect={() => setEditingTicket(item.ticket)} />
    }
    return (
      <StayMomentCard
        moment={item.moment}
        dayNumber={dayNumberOf(item.moment.date)}
        onSelect={() => setEditingStay(item.moment.stay)}
      />
    )
  }

  const scan = (
    <BoardingPassScan
      tripId={tripId}
      days={days}
      entries={entries}
      userUid={userUid}
      memberUids={memberUids}
    />
  )

  if (allTickets.length === 0 && stays.length === 0) {
    return (
      <div className={styles.view}>
        {scan}
        <p className={styles.empty}>
          Ingen fly, tog, busser, færger eller overnatninger endnu. Tilføj dem under de enkelte dage
          på fanen “Dage” — så samles de her i tidsorden.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.view}>
      {scan}
      <TicketFilters
        modes={presentModes}
        hasStays={stays.length > 0}
        active={filter}
        onChange={setFilter}
      />

      {editingTicket && (
        <SegmentDetailForm
          tripId={tripId}
          dayId={editingTicket.dayId}
          dayDate={editingTicket.dayDate}
          segment={editingTicket.segment}
          onClose={() => setEditingTicket(null)}
        />
      )}
      {editingStay && (
        <StayForm
          key={editingStay.id}
          tripId={tripId}
          userUid={userUid}
          memberUids={memberUids}
          stay={editingStay}
          onClose={() => setEditingStay(null)}
        />
      )}

      {next && nextTime && (
        <section className={styles.next}>
          <p className={styles.nextLabel}>
            Næste · <strong>{formatCountdown(nextTime, now)}</strong>
          </p>
          {renderItem(next)}
        </section>
      )}

      <ul className={styles.list}>
        {items
          .filter((item) => item !== next)
          .map((item) => {
            const time = itemTime(item)
            return (
              <li
                key={item.key}
                className={styles.item}
                data-past={Boolean(time && new Date(time) < now)}
              >
                {renderItem(item)}
              </li>
            )
          })}
      </ul>
    </div>
  )
}
