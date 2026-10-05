import type { Day } from '../../days/types'
import { useOfflinePasses } from '../hooks/useOfflinePasses'
import { useTripSegments } from '../hooks/useTripSegments'

/** Usynlig: holder rejsens transport og boardingkort/billetter klar til offline brug. */
export function OfflinePasses({
  tripId,
  days,
  userUid,
}: {
  tripId: string
  days: Day[]
  userUid: string
}) {
  const { entries } = useTripSegments(tripId, days, userUid)
  useOfflinePasses(entries)
  return null
}
