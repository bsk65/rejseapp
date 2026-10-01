import { useEffect, useMemo, useState } from 'react'
import type { Day } from '../../days/types'
import type { TicketEntry } from '../logic/tickets'
import { subscribeToSegments } from '../repository'
import type { Segment } from '../types'

/**
 * Alle segmenter på tværs af rejsens dage. Segmenter ligger i en
 * subcollection pr. dag, så der abonneres pr. dag — en rejse har typisk få
 * nok dage til at det er uproblematisk.
 */
export function useTripSegments(tripId: string, days: Day[], memberUid: string) {
  const [segmentsByDay, setSegmentsByDay] = useState<Record<string, Segment[]>>({})
  const dayIdsKey = days.map((day) => day.id).join(',')

  useEffect(() => {
    if (!memberUid || !dayIdsKey) return
    const unsubscribes = dayIdsKey
      .split(',')
      .map((dayId) =>
        subscribeToSegments(tripId, dayId, memberUid, (segments) =>
          setSegmentsByDay((prev) => ({ ...prev, [dayId]: segments })),
        ),
      )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [tripId, dayIdsKey, memberUid])

  // Memoiseret, så f.eks. afspilningen ikke regnes forfra ved hver gentegning.
  const entries: TicketEntry[] = useMemo(
    () =>
      days.flatMap((day) =>
        (segmentsByDay[day.id] ?? []).map((segment) => ({
          segment,
          dayId: day.id,
          dayNumber: day.dayNumber,
          dayDate: day.date,
        })),
      ),
    [days, segmentsByDay],
  )

  return { entries }
}
