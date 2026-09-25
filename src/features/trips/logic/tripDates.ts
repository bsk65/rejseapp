export function computeEndDate(startDate: string, days: number): string {
  // UTC (ikke lokal tid) for at undgå at datoen skifter afhængigt af browserens tidszone.
  const start = new Date(`${startDate}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() + Math.max(days - 1, 0))
  return start.toISOString().slice(0, 10)
}

export function formatDateRange(startDate: string, days: number): string {
  const end = computeEndDate(startDate, days)
  if (end === startDate) {
    return startDate
  }
  return `${startDate} – ${end}`
}
