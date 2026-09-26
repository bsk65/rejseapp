import { transportModeLabel, type Segment } from '../types'

export function describeSegment(segment: Segment): string {
  const label = transportModeLabel[segment.mode]
  const hasDetails = Boolean(
    segment.carrier || segment.departureTime || segment.arrivalTime || segment.freeText,
  )

  if (!hasDetails) {
    return `${label}, mangler detaljer`
  }

  const parts = [
    segment.carrier,
    segment.departureTime && `afgang ${segment.departureTime}`,
  ].filter(Boolean)
  return parts.length > 0 ? `${label}, ${parts.join(', ')}` : label
}
