import type { Day } from '../../days/types'

/**
 * Hvilken dag et segment hører til: dagen med samme dato som afgangen. Har
 * afgangen ingen dato, eller ligger datoen uden for rejsens dage, bliver det
 * på den dag, det ligger på nu.
 */
export function dayIdForDeparture(
  departureTime: string | undefined,
  days: Pick<Day, 'id' | 'date'>[],
  currentDayId: string,
): string {
  const date = departureTime?.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (!date) return currentDayId
  return days.find((day) => day.date === date)?.id ?? currentDayId
}
