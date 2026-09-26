import { addDaysToIsoDate } from '../../../shared/utils/date'

export function computeEndDate(startDate: string, days: number): string {
  return addDaysToIsoDate(startDate, Math.max(days - 1, 0))
}

export function formatDateRange(startDate: string, days: number): string {
  const end = computeEndDate(startDate, days)
  if (end === startDate) {
    return startDate
  }
  return `${startDate} – ${end}`
}
