/**
 * Omsætter svar fra AeroDataBox (GET /flights/number/{flightNumber}/{date})
 * til det lille format, appen bruger. Ren funktion — testes uden netværk.
 *
 * Typen FlightInfo er spejlet i appen (src/features/segments/api/flightLookup.ts)
 * — hold dem ens.
 */

export type FlightEndpoint = {
  iata?: string
  /** Visningsnavn, f.eks. "København (CPH)". */
  name: string
  lat?: number
  lng?: number
  /** Lokal tid som "YYYY-MM-DDTHH:mm". */
  time?: string
  terminal?: string
}

export type FlightInfo = {
  /** Selskabets navn, f.eks. "SAS". */
  airline?: string
  /** Flynummer som selskabet skriver det, f.eks. "SK 1415". */
  number: string
  departure: FlightEndpoint
  arrival: FlightEndpoint
}

type AdbAirport = {
  iata?: string
  name?: string
  shortName?: string
  municipalityName?: string
  location?: { lat?: number; lon?: number }
}

type AdbMovement = {
  airport?: AdbAirport
  scheduledTime?: { local?: string }
  /** Ældre API-versioner. */
  scheduledTimeLocal?: string
  terminal?: string
}

type AdbFlight = {
  number?: string
  airline?: { name?: string }
  departure?: AdbMovement
  arrival?: AdbMovement
}

/** "2026-10-03 07:40+02:00" → "2026-10-03T07:40" */
function toLocalDateTime(value: string | undefined): string | undefined {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
  return match ? `${match[1]}T${match[2]}` : undefined
}

function toEndpoint(movement: AdbMovement | undefined): FlightEndpoint {
  const airport = movement?.airport ?? {}
  const city = airport.municipalityName ?? airport.shortName ?? airport.name ?? 'Ukendt lufthavn'
  return {
    iata: airport.iata,
    name: airport.iata ? `${city} (${airport.iata})` : city,
    lat: airport.location?.lat,
    lng: airport.location?.lon,
    time: toLocalDateTime(movement?.scheduledTime?.local ?? movement?.scheduledTimeLocal),
    terminal: movement?.terminal || undefined,
  }
}

export function mapAeroDataBoxFlights(response: unknown): FlightInfo[] {
  if (!Array.isArray(response)) return []
  return (response as AdbFlight[]).map((flight) => ({
    airline: flight.airline?.name,
    number: flight.number ?? '',
    departure: toEndpoint(flight.departure),
    arrival: toEndpoint(flight.arrival),
  }))
}

/** "sk 1415" → "SK1415". Returnerer undefined for noget, der ikke ligner et flynummer. */
export function normalizeFlightNumber(input: string): string | undefined {
  const compact = input.toUpperCase().replace(/\s+/g, '')
  return /^[A-Z0-9]{2}[A-Z]?\d{1,4}[A-Z]?$/.test(compact) ? compact : undefined
}
