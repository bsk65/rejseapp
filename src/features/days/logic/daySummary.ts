import type { Place } from '../../../shared/types/place'
import type { Day } from '../types'

/** "Billund → Paris", "Paris" (samme sted / kun ét kendt), eller undefined. */
export function routeLabel(from: Place | undefined, to: Place | undefined): string | undefined {
  if (from && to) return from.placeId === to.placeId ? from.name : `${from.name} → ${to.name}`
  return (from ?? to)?.name
}

/** Klokkeslættet (HH:mm) i et segment-tidspunkt — fuld dato+tid eller kun tid. */
export function clockTime(value: string | undefined): string | undefined {
  return value?.match(/(\d{2}:\d{2})/)?.[1]
}

/**
 * De dage, der er foldet ud, når rejsen åbnes: kun dagen med dags dato
 * (resten er foldet sammen, så en lang rejse er til at overskue).
 */
export function initiallyExpandedDayIds(days: Day[], today: string): string[] {
  return days.filter((day) => day.date === today).map((day) => day.id)
}
