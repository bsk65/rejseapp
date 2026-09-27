import type { Place } from '../../../shared/types/place'
import type { FlightEndpoint, FlightInfo } from '../api/flightLookup'
import type { SegmentDetails } from '../types'

function toPlace(endpoint: FlightEndpoint): Place | undefined {
  if (endpoint.lat === undefined || endpoint.lng === undefined) return undefined
  return {
    name: endpoint.name,
    lat: endpoint.lat,
    lng: endpoint.lng,
    placeId: endpoint.iata ? `iata:${endpoint.iata}` : `flight:${endpoint.name}`,
  }
}

/** De segment-felter, et flyopslag kan udfylde. Tomme felter udelades. */
export function flightToSegmentDetails(flight: FlightInfo): Partial<SegmentDetails> {
  const details: Partial<SegmentDetails> = {
    carrier: flight.airline,
    number: flight.number || undefined,
    departurePlace: toPlace(flight.departure),
    departureTime: flight.departure.time,
    terminal: flight.departure.terminal,
    arrivalPlace: toPlace(flight.arrival),
    arrivalTime: flight.arrival.time,
  }
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as Partial<SegmentDetails>
}

/**
 * Vælger det rigtige fly blandt opslagets resultater. Et flynummer kan have
 * flere strækninger samme dag (f.eks. CPH → FRA → LIS); kendes
 * afgangslufthavnen (fra boardingkortet), bruges den.
 */
export function pickFlight(flights: FlightInfo[], fromAirport?: string): FlightInfo | undefined {
  if (fromAirport) {
    const match = flights.find((f) => f.departure.iata === fromAirport)
    if (match) return match
  }
  return flights[0]
}

/** "SK 1415", "sk1415", "SK01415" → "SK1415" — til at sammenligne flynumre. */
export function compactFlightNumber(value: string | undefined): string {
  const compact = (value ?? '').toUpperCase().replace(/\s+/g, '')
  return compact.replace(/^([A-Z0-9]{2})0+(?=\d)/, '$1')
}
