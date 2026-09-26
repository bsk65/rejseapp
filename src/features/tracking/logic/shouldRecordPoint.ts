import type { LatLng } from '../../../shared/types/place'
import { distanceMeters } from '../../../shared/utils/geo'

export type GpsFix = LatLng & {
  /** ISO-tidspunkt. */
  timestamp: string
  /** Usikkerhed i meter, som rapporteret af browseren. */
  accuracy?: number
}

export type RecordingRules = {
  /** Gem et nyt punkt når man har flyttet sig mindst så langt. */
  minDistanceMeters: number
  /** Gem alligevel et punkt efter så lang tid, selv hvis man står stille. */
  maxIntervalMinutes: number
  /** Ignorér målinger der er mere upræcise end dette. */
  maxAccuracyMeters: number
}

export const DEFAULT_RECORDING_RULES: RecordingRules = {
  minDistanceMeters: 100,
  maxIntervalMinutes: 15,
  maxAccuracyMeters: 200,
}

/**
 * Afgør om en ny GPS-måling skal gemmes som sporingspunkt, så der ikke
 * skrives et Firestore-dokument for hver eneste måling browseren leverer.
 */
export function shouldRecordPoint(
  lastRecorded: GpsFix | null,
  next: GpsFix,
  rules: RecordingRules = DEFAULT_RECORDING_RULES,
): boolean {
  if (next.accuracy !== undefined && next.accuracy > rules.maxAccuracyMeters) {
    return false
  }
  if (!lastRecorded) {
    return true
  }
  if (distanceMeters(lastRecorded, next) >= rules.minDistanceMeters) {
    return true
  }
  const minutes = (Date.parse(next.timestamp) - Date.parse(lastRecorded.timestamp)) / 60_000
  return minutes >= rules.maxIntervalMinutes
}
