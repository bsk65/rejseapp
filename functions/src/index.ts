import { defineSecret } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { mapAeroDataBoxFlights, normalizeFlightNumber, type FlightInfo } from './flightInfo.js'

/**
 * API-nøgle til AeroDataBox (via RapidAPI). Sættes med
 *   firebase functions:secrets:set AERODATABOX_API_KEY
 * og ligger aldrig i appen eller i git.
 */
const aeroDataBoxKey = defineSecret('AERODATABOX_API_KEY')

const API_HOST = 'aerodatabox.p.rapidapi.com'

/**
 * Slår et fly op ud fra flynummer og dato og returnerer lufthavne, tider og
 * terminal. Kun for loggede-ind brugere (appens egne), så nøglen ikke kan
 * misbruges udefra.
 */
export const lookupFlight = onCall(
  { region: 'europe-west1', secrets: [aeroDataBoxKey], maxInstances: 2 },
  async (request): Promise<FlightInfo[]> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Du skal være logget ind.')
    }

    const data = (request.data ?? {}) as { flightNumber?: unknown; date?: unknown }
    const flightNumber =
      typeof data.flightNumber === 'string' ? normalizeFlightNumber(data.flightNumber) : undefined
    const date =
      typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : undefined
    if (!flightNumber || !date) {
      throw new HttpsError('invalid-argument', 'Angiv flynummer (f.eks. SK1415) og dato.')
    }

    const response = await fetch(
      `https://${API_HOST}/flights/number/${flightNumber}/${date}?withAircraftImage=false&withLocation=false`,
      { headers: { 'X-RapidAPI-Key': aeroDataBoxKey.value(), 'X-RapidAPI-Host': API_HOST } },
    )

    if (response.status === 204 || response.status === 404) return []
    if (response.status === 429) {
      throw new HttpsError('resource-exhausted', 'For mange opslag lige nu. Prøv igen senere.')
    }
    if (!response.ok) {
      throw new HttpsError('unavailable', `Flydatatjenesten svarede ${response.status}.`)
    }

    return mapAeroDataBoxFlights(await response.json())
  },
)
