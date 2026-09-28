import type { StayMoment } from '../../stays/logic/stayDates'
import { compareCodePoints, ticketSortKey, type Ticket } from './tickets'

/** Et punkt i "Billetter & tider": en afgang eller en ind-/udtjekning. */
export type TimelineItem =
  | { kind: 'ticket'; key: string; ticket: Ticket }
  | { kind: 'stay'; key: string; moment: StayMoment }

/** Fuldt tidspunkt (YYYY-MM-DDTHH:mm), hvis både dato og klokkeslæt kendes. */
export function itemTime(item: TimelineItem): string | undefined {
  return item.kind === 'ticket' ? item.ticket.departsAt : item.moment.at
}

/** Samme regel som for billetter: kun dato sorteres først på dagen. */
function sortKey(item: TimelineItem): string {
  return item.kind === 'ticket'
    ? ticketSortKey(item.ticket)
    : (item.moment.at ?? `${item.moment.date}T`)
}

/** Fletter afgange og ind-/udtjekninger til én tidsordnet liste. */
export function buildTicketTimeline(tickets: Ticket[], moments: StayMoment[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...tickets.map((ticket): TimelineItem => ({ kind: 'ticket', key: ticket.segment.id, ticket })),
    ...moments.map((moment): TimelineItem => ({
      kind: 'stay',
      key: `${moment.stay.id}:${moment.kind}`,
      moment,
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
