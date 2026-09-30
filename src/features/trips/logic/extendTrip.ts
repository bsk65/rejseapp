import { addDaysToIsoDate } from '../../../shared/utils/date'
import { countTripDays } from './tripDates'

type DatedDay = { id: string; dayNumber: number; date: string }

export type TripExtension = {
  startDate: string
  days: number
  /** Eksisterende dage, hvis dagnummer ændres (fordi rejsen nu starter tidligere). */
  renumbered: { id: string; dayNumber: number }[]
  /** Nye dage, der skal oprettes. */
  added: { dayNumber: number; date: string }[]
}

/**
 * Forlænger en rejse med `before` dage før start og `after` dage efter slut.
 * Dagnumre regnes ud fra datoen, så dag 1 altid er den (nye) første dag.
 */
export function planTripExtension(
  startDate: string,
  dayCount: number,
  existingDays: DatedDay[],
  before: number,
  after: number,
): TripExtension {
  const newStart = addDaysToIsoDate(startDate, -before)
  const newCount = dayCount + before + after
  const numberOf = (date: string) => countTripDays(newStart, date) ?? 0

  const renumbered = existingDays
    .map((day) => ({ id: day.id, dayNumber: numberOf(day.date), old: day.dayNumber }))
    .filter((day) => day.dayNumber > 0 && day.dayNumber !== day.old)
    .map(({ id, dayNumber }) => ({ id, dayNumber }))

  const existingDates = new Set(existingDays.map((day) => day.date))
  const added: TripExtension['added'] = []
  for (let offset = 0; offset < newCount; offset++) {
    const date = addDaysToIsoDate(newStart, offset)
    if (!existingDates.has(date)) added.push({ dayNumber: offset + 1, date })
  }

  return { startDate: newStart, days: newCount, renumbered, added }
}
