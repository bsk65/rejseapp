import type { Day } from '../../days/types'
import type { Reservation } from '../../reservations/types'
import { useOfflinePasses } from '../hooks/useOfflinePasses'
import { useTripSegments } from '../hooks/useTripSegments'

/** Usynlig: holder rejsens boardingkort/billetter (også reservationers) klar til offline brug. */
export function OfflinePasses({
  tripId,
  days,
  userUid,
  reservations,
}: {
  tripId: string
  days: Day[]
  userUid: string
  reservations: Reservation[]
}) {
  const { entries } = useTripSegments(tripId, days, userUid)
  useOfflinePasses([
    ...entries.flatMap((entry) => entry.segment.boardingPasses ?? []),
    ...reservations.flatMap((reservation) => reservation.tickets ?? []),
  ])
  return null
}
