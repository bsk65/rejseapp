import type { Reservation } from '../types'

/** Dagens reservationer, sorteret efter klokkeslæt (uden tid sidst). */
export function reservationsForDate(reservations: Reservation[], date: string): Reservation[] {
  return reservations
    .filter((reservation) => reservation.date === date)
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
}

/** Fuldt tidspunkt (YYYY-MM-DDTHH:mm), hvis klokkeslættet kendes. */
export function reservationAt(reservation: Reservation): string | undefined {
  return reservation.time ? `${reservation.date}T${reservation.time}` : undefined
}
