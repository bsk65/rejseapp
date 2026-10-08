import type { Translate } from '../../../shared/i18n/translator'
import type { Reservation, ReservationKind } from '../../reservations/types'
import { describeSegment } from '../../segments/logic/describeSegment'
import type { TicketEntry } from '../../segments/logic/tickets'
import type { Stay } from '../../stays/types'
import type { CostCategory, CostSource } from '../types'

const reservationCategory: Record<ReservationKind, CostCategory> = {
  restaurant: 'restaurant',
  aktivitet: 'activity',
  andet: 'other',
}

/**
 * Rejsens bookinger som poster i prisoversigten. Bil og gang tæller kun med,
 * hvis de har en pris (lejebil) — ellers ville egen bil og gåture stå som
 * "uden pris".
 */
export function costSources(
  entries: TicketEntry[],
  stays: Stay[],
  reservations: Reservation[],
  t: Translate,
): CostSource[] {
  const transport = entries
    .filter(({ segment }) => segment.price || (segment.mode !== 'bil' && segment.mode !== 'gang'))
    .map(({ segment, dayDate }): CostSource => {
      const { title } = describeSegment(segment, t)
      const from = segment.departurePlace?.name
      const to = segment.arrivalPlace?.name
      const route = from || to ? ` · ${from ?? '?'} → ${to ?? '?'}` : ''
      return {
        key: `segment-${segment.id}`,
        category: 'transport',
        label: `${title}${route}`,
        date: segment.departureTime?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? dayDate,
        price: segment.price,
      }
    })

  const stayItems = stays.map((stay): CostSource => ({
    key: `stay-${stay.id}`,
    category: 'stays',
    label: stay.name,
    date: stay.checkInDate,
    price: stay.price,
  }))

  const reservationItems = reservations.map((reservation): CostSource => ({
    key: `reservation-${reservation.id}`,
    category: reservationCategory[reservation.kind],
    label: reservation.name,
    date: reservation.date,
    price: reservation.price,
  }))

  return [...transport, ...stayItems, ...reservationItems]
}
