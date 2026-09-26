import type { Day } from '../../days/types'

/** Finder den dag hvis dato matcher billedets EXIF-tidspunkt (kun dato-delen). */
export function matchPhotoToDay(takenAt: string | undefined, days: Day[]): string | undefined {
  if (!takenAt) return undefined
  const takenDate = takenAt.slice(0, 10)
  return days.find((day) => day.date === takenDate)?.id
}
