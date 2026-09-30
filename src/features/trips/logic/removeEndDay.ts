import { addDaysToIsoDate } from '../../../shared/utils/date'
import { computeEndDate, countTripDays } from './tripDates'

type DatedDay = { id: string; dayNumber: number; date: string }

export type DayRemoval = {
  startDate: string
  days: number
  /** Tilbageværende dage, hvis dagnummer ændres (når første dag fjernes). */
  renumbered: { id: string; dayNumber: number }[]
}

/** Kun rejsens første og sidste dag kan fjernes — ellers kom der et hul i datoerne. */
export function isEndDay(startDate: string, dayCount: number, date: string): boolean {
  return dayCount > 1 && (date === startDate || date === computeEndDate(startDate, dayCount))
}

/**
 * Gør rejsen én dag kortere ved at fjerne dens første eller sidste dag.
 * Returnerer null, hvis dagen ikke er en af enderne, eller det er den eneste dag.
 */
export function planDayRemoval(
  startDate: string,
  dayCount: number,
  days: DatedDay[],
  dayId: string,
): DayRemoval | null {
  const day = days.find((d) => d.id === dayId)
  if (!day || !isEndDay(startDate, dayCount, day.date)) return null

  if (day.date !== startDate) {
    return { startDate, days: dayCount - 1, renumbered: [] }
  }

  const newStart = addDaysToIsoDate(startDate, 1)
  const renumbered = days
    .filter((d) => d.id !== dayId)
    .map((d) => ({ id: d.id, dayNumber: countTripDays(newStart, d.date) ?? 0, old: d.dayNumber }))
    .filter((d) => d.dayNumber > 0 && d.dayNumber !== d.old)
    .map(({ id, dayNumber }) => ({ id, dayNumber }))

  return { startDate: newStart, days: dayCount - 1, renumbered }
}
