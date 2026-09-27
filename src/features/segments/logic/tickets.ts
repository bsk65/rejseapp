import type { Segment, TransportMode } from '../types'

/** Transportformer hvor man skal passe en tid og typisk har billet/boardingkort. */
export const TICKET_MODES: TransportMode[] = ['fly', 'tog', 'bus', 'færge']

export type TicketEntry = {
  segment: Segment
  dayId: string
  dayNumber: number
  /** Dagens dato (YYYY-MM-DD) — bruges når segmentet kun har et klokkeslæt. */
  dayDate: string
}

export type Ticket = TicketEntry & {
  /** Fuldt lokalt tidspunkt (YYYY-MM-DDTHH:mm), hvis både dato og klokkeslæt kendes. */
  departsAt?: string
  /** Klokkeslæt (HH:mm), hvis kendt. */
  time?: string
  /** Den dato afgangen vises under. */
  date: string
}

const TIME_ONLY = /^\d{2}:\d{2}$/
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/

/**
 * departureTime kan være fuld dato+tid (fra datetime-local eller parseren),
 * kun en dato, kun et klokkeslæt, eller mangle — normaliser til ét format.
 */
function resolveDeparture(entry: TicketEntry): Pick<Ticket, 'departsAt' | 'time' | 'date'> {
  const raw = entry.segment.departureTime
  const full = raw?.match(DATE_TIME)
  if (full) return { departsAt: `${full[1]}T${full[2]}`, time: full[2], date: full[1] }
  if (raw && TIME_ONLY.test(raw)) {
    return { departsAt: `${entry.dayDate}T${raw}`, time: raw, date: entry.dayDate }
  }
  if (raw && DATE_ONLY.test(raw)) return { date: raw }
  return { date: entry.dayDate }
}

/** Sorteringsnøgle: uden klokkeslæt lægges først på dagen (dato) eller sidst (intet). */
function sortKey(ticket: Ticket): string {
  if (ticket.departsAt) return ticket.departsAt
  return ticket.segment.departureTime ? `${ticket.date}T` : `${ticket.date}T~`
}

/** Ren tegn-for-tegn-sammenligning — localeCompare ignorerer bl.a. '~' og sorterer derfor forkert. */
function compareCodePoints(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** Samler billet-relevante segmenter fra alle dage i tidsorden, evt. filtreret på transportform. */
export function buildTickets(entries: TicketEntry[], mode: TransportMode | 'alle'): Ticket[] {
  return entries
    .filter((entry) => TICKET_MODES.includes(entry.segment.mode))
    .filter((entry) => mode === 'alle' || entry.segment.mode === mode)
    .map((entry) => ({ ...entry, ...resolveDeparture(entry) }))
    .sort((a, b) => compareCodePoints(sortKey(a), sortKey(b)) || a.dayNumber - b.dayNumber)
}

/** Første afgang med kendt tidspunkt, der ikke er passeret endnu. */
export function findNextDeparture(tickets: Ticket[], now: Date): Ticket | undefined {
  return tickets.find(
    (ticket) => ticket.departsAt !== undefined && new Date(ticket.departsAt) >= now,
  )
}

/** "om 12 min", "om 2 t 15 min", "om 3 dage". */
export function formatCountdown(departsAt: string, now: Date): string {
  const minutes = Math.max(0, Math.round((new Date(departsAt).getTime() - now.getTime()) / 60_000))
  if (minutes < 60) return `om ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    const rest = minutes % 60
    return rest > 0 ? `om ${hours} t ${rest} min` : `om ${hours} t`
  }
  return `om ${Math.floor(hours / 24)} dage`
}
