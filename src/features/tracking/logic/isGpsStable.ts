import { distanceMeters } from '../../../shared/utils/geo'
import type { GpsFix } from './shouldRecordPoint'

export type WarmupRules = {
  /** Mindste tid efter start, før der må gemmes noget. */
  minSeconds: number
  /** Antal målinger i træk, der skal passe sammen. */
  stableFixes: number
  /** Hurtigere "bevægelse" mellem to målinger end dette er et GPS-hop, ikke virkelighed. */
  maxSpeedMetersPerSecond: number
}

export const DEFAULT_WARMUP_RULES: WarmupRules = {
  minSeconds: 20,
  stableFixes: 3,
  // ~250 km/t — hurtigere end tog og bil, men langt under et hop på flere km på sekunder.
  maxSpeedMetersPerSecond: 70,
}

/**
 * Afgør om GPS'en er "varmet op" efter start. Lige efter start giver
 * telefoner ofte en grov position ud fra mobilmaster (især på landet), som kan
 * ligge mange km forkert — nogle gange endda med en påstået god præcision.
 * Vi kræver derfor at der er gået lidt tid, og at de seneste målinger passer
 * sammen (ingen urealistiske spring imellem dem).
 */
export function isGpsStable(
  recentFixes: GpsFix[],
  startedAt: string,
  rules: WarmupRules = DEFAULT_WARMUP_RULES,
): boolean {
  if (recentFixes.length < rules.stableFixes) {
    return false
  }
  const window = recentFixes.slice(-rules.stableFixes)
  const newest = window[window.length - 1]
  const elapsedSeconds = (Date.parse(newest.timestamp) - Date.parse(startedAt)) / 1000
  if (elapsedSeconds < rules.minSeconds) {
    return false
  }

  for (let i = 1; i < window.length; i++) {
    const seconds = Math.max(
      (Date.parse(window[i].timestamp) - Date.parse(window[i - 1].timestamp)) / 1000,
      1,
    )
    if (distanceMeters(window[i - 1], window[i]) / seconds > rules.maxSpeedMetersPerSecond) {
      return false
    }
  }
  return true
}
