import type { Translate } from '../../../shared/i18n/translator'
import type { Reservation, ReservationKind } from '../../reservations/types'
import { describeSegment } from '../../segments/logic/describeSegment'
import { departureDate } from '../../segments/logic/priceCovers'
import { travelersOf } from '../../segments/logic/travelers'
import type { TicketEntry } from '../../segments/logic/tickets'
import type { Stay } from '../../stays/types'
import type { CostCategory, CostSource } from '../types'

const reservationCategory: Record<ReservationKind, CostCategory> = {
  restaurant: 'restaurant',
  aktivitet: 'activity',
  andet: 'other',
}

/**
 * Transport som poster. Bil og gang tæller kun med, hvis de har en pris
 * (lejebil) — ellers ville egen bil og gåture stå som "uden pris". En rejse
 * uden egen pris, som en anden rejses pris dækker (priceCovers), vises under
 * den pris ("inkl. …") i stedet for som "uden pris".
 */
function transportSources(entries: TicketEntry[], t: Translate): CostSource[] {
  const titleOf = new Map(
    entries.map(({ segment }) => [segment.id, describeSegment(segment, t).title]),
  )
  const unpriced = new Set(
    entries.filter(({ segment }) => !segment.price).map(({ segment }) => segment.id),
  )
  const covered = new Set(
    entries.flatMap(({ segment }) =>
      segment.price ? (segment.priceCovers ?? []).filter((id) => unpriced.has(id)) : [],
    ),
  )

  return entries
    .filter(({ segment }) => !covered.has(segment.id))
    .filter(({ segment }) => segment.price || (segment.mode !== 'bil' && segment.mode !== 'gang'))
    .map((entry): CostSource => {
      const { segment } = entry
      const from = segment.departurePlace?.name
      const to = segment.arrivalPlace?.name
      const route = from || to ? ` · ${from ?? '?'} → ${to ?? '?'}` : ''
      const includes = segment.price
        ? (segment.priceCovers ?? [])
            .filter((id) => covered.has(id))
            .map((id) => titleOf.get(id) ?? '')
        : []
      return {
        key: `segment-${segment.id}`,
        category: 'transport',
        label: `${titleOf.get(segment.id) ?? ''}${route}`,
        date: departureDate(entry),
        price: segment.price,
        includes: includes.length > 0 ? includes : undefined,
        quantity: segment.priceFor === 'person' ? travelersOf(segment).length : undefined,
      }
    })
}

/** Rejsens bookinger som poster i prisoversigten. */
export function costSources(
  entries: TicketEntry[],
  stays: Stay[],
  reservations: Reservation[],
  t: Translate,
): CostSource[] {
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

  return [...transportSources(entries, t), ...stayItems, ...reservationItems]
}
