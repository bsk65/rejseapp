import type { Place } from '../../../shared/types/place'
import type { Day } from '../types'

/**
 * Skal næste dags "Fra" følge med, når "Til" på dagen før ændres? Ja, hvis
 * næste dag ikke har et "Fra" endnu, eller hvis dens "Fra" blot var den
 * tidligere "Til" (dvs. fulgte automatisk med og ikke er valgt bevidst).
 */
export function shouldFollowPreviousTo(nextDay: Day | undefined, previousTo?: Place): boolean {
  if (!nextDay) return false
  if (!nextDay.fromPlace) return true
  return previousTo !== undefined && nextDay.fromPlace.placeId === previousTo.placeId
}

/** "Fra" der vises for en dag: dens egen, ellers dagen før's "Til". */
export function effectiveFromPlace(day: Day, previousDay: Day | undefined): Place | undefined {
  return day.fromPlace ?? previousDay?.toPlace
}
