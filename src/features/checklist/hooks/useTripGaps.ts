import { useMemo } from 'react'
import type { Day } from '../../days/types'
import { usePeople } from '../../friends/hooks/usePeople'
import type { Reservation } from '../../reservations/types'
import { useTripSegments } from '../../segments/hooks/useTripSegments'
import type { Stay } from '../../stays/types'
import { findGaps, groupGaps, openGapCount } from '../logic/findGaps'

/** Rejsens huller ("Mangler at booke") for alle, der rejser med (ikke dem, der kun kigger med). */
export function useTripGaps(
  tripId: string,
  days: Day[],
  stays: Stay[],
  reservations: Reservation[],
  userUid: string,
) {
  const { memberUids, selfUid } = usePeople()
  const { entries } = useTripSegments(tripId, days, userUid)
  const travelerUids = useMemo(
    () => (memberUids.length > 0 ? memberUids : [selfUid || userUid]),
    [memberUids, selfUid, userUid],
  )
  const groups = useMemo(
    () => groupGaps(findGaps({ days, entries, stays, reservations }, travelerUids), days),
    [days, entries, stays, reservations, travelerUids],
  )
  return { groups, travelerUids, openCount: openGapCount(groups) }
}
