import { shouldRecordPoint, type GpsFix } from './shouldRecordPoint'

/** Øvre grænse for hvor mange punkter ét importeret spor må fylde i databasen. */
export const MAX_IMPORTED_POINTS = 1000

const BASE_RULES = {
  minDistanceMeters: 50,
  maxIntervalMinutes: 10,
  // Ure angiver ikke præcision pr. punkt i GPX — ingen filtrering her.
  maxAccuracyMeters: Infinity,
}

function thinWith(fixes: GpsFix[], minDistanceMeters: number): GpsFix[] {
  const rules = { ...BASE_RULES, minDistanceMeters }
  const kept: GpsFix[] = []
  for (const fix of fixes) {
    if (shouldRecordPoint(kept[kept.length - 1] ?? null, fix, rules)) {
      kept.push(fix)
    }
  }
  // Slutpunktet skal altid med, så sporet ender det rigtige sted.
  const last = fixes[fixes.length - 1]
  if (last && kept[kept.length - 1] !== last) kept.push(last)
  return kept
}

/**
 * Tynder et importeret spor ud (et ur logger typisk hvert sekund) til ét
 * punkt pr. ~50 m. Er det stadig for mange punkter, fordobles afstanden,
 * indtil sporet holder sig under MAX_IMPORTED_POINTS.
 */
export function thinTrack(fixes: GpsFix[], maxPoints = MAX_IMPORTED_POINTS): GpsFix[] {
  let minDistance = BASE_RULES.minDistanceMeters
  let kept = thinWith(fixes, minDistance)
  while (kept.length > maxPoints && minDistance < 100_000) {
    minDistance *= 2
    kept = thinWith(fixes, minDistance)
  }
  return kept
}
