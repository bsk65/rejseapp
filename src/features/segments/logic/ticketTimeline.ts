import { reservationAt } from '../../reservations/logic/reservationDates'
import type { Reservation } from '../../reservations/types'
import type { StayMoment } from '../../stays/logic/stayDates'
import { compareCodePoints, ticketSortKey, type Ticket } from './tickets'

/** Et punkt i "Billetter & tider": en afgang, en ind-/udtjekning eller en reservation. */
export type TimelineItem =
  | { kind: 'ticket'; key: string; ticket: Ticket }
  | { kind: 'stay'; key: string; moment: StayMoment }
  | { kind: 'reservation'; key: string; reservation: Reservation }

/** Fuldt tidspunkt (YYYY-MM-DDTHH:mm), hvis både dato og klokkeslæt kendes. */
export function itemTime(item: TimelineItem): string | undefined {
  if (item.kind === 'ticket') return item.ticket.departsAt
  if (item.kind === 'reservation') return reservationAt(item.reservation)
  return item.moment.at
}

/** Samme regel som for billetter: kun dato sorteres først på dagen. */
function sortKey(item: TimelineItem): string {
  if (item.kind === 'ticket') return ticketSortKey(item.ticket)
  if (item.kind === 'reservation') {
    return reservationAt(item.reservation) ?? `${item.reservation.date}T`
  }
  return item.moment.at ?? `${item.moment.date}T`
}

/** Fletter afgange, ind-/udtjekninger og reservationer til én tidsordnet liste. */
export function buildTicketTimeline(
  tickets: Ticket[],
  moments: StayMoment[],
  reservations: Reservation[] = [],
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...tickets.map((ticket): TimelineItem => ({ kind: 'ticket', key: ticket.segment.id, ticket })),
    ...moments.map((moment): TimelineItem => ({
      kind: 'stay',
      key: `${moment.stay.id}:${moment.kind}`,
      moment,
    })),
    ...reservations.map((reservation): TimelineItem => ({
      kind: 'reservation',
      key: `reservation:${reservation.id}`,
      reservation,
    })),
  ]
  return items.sort((a, b) => compareCodePoints(sortKey(a), sortKey(b)))
}

/** Første punkt med kendt tidspunkt, der ikke er passeret endnu. */
export function findNextItem(items: TimelineItem[], now: Date): TimelineItem | undefined {
  return items.find((item) => {
    const time = itemTime(item)
    return time !== undefined && new Date(time) >= now
  })
}
