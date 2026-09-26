import * as exifr from 'exifr'
import type { LatLng } from '../../../shared/types/place'

export type PhotoMetadata = {
  takenAt?: string
  location?: LatLng
}

async function parseDateTimeOriginal(file: File): Promise<Date | undefined> {
  const result: unknown = await exifr
    .parse(file, { pick: ['DateTimeOriginal'] })
    .catch(() => undefined)
  if (!result || typeof result !== 'object') return undefined
  const value = (result as Record<string, unknown>).DateTimeOriginal
  return value instanceof Date ? value : undefined
}

export async function readPhotoMetadata(file: File): Promise<PhotoMetadata> {
  const [gps, date] = await Promise.all([
    exifr.gps(file).catch(() => undefined),
    parseDateTimeOriginal(file),
  ])

  return {
    takenAt: date ? date.toISOString() : undefined,
    location: gps ? { lat: gps.latitude, lng: gps.longitude } : undefined,
  }
}
