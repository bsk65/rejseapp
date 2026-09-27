import { FirebaseError } from 'firebase/app'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../firebase/config'

/** Spejling af FlightInfo i functions/src/flightInfo.ts — hold dem ens. */
export type FlightEndpoint = {
  iata?: string
  name: string
  lat?: number
  lng?: number
  /** Lokal tid "YYYY-MM-DDTHH:mm". */
  time?: string
  terminal?: string
}

export type FlightInfo = {
  airline?: string
  number: string
  departure: FlightEndpoint
  arrival: FlightEndpoint
}

const lookupFlightCallable = httpsCallable<{ flightNumber: string; date: string }, FlightInfo[]>(
  functions,
  'lookupFlight',
)

/**
 * Slår et fly op via Cloud Function'en "lookupFlight" (som kalder
 * AeroDataBox). Returnerer en tom liste, hvis flyet ikke findes.
 */
export async function lookupFlight(flightNumber: string, date: string): Promise<FlightInfo[]> {
  try {
    const result = await lookupFlightCallable({ flightNumber, date })
    return result.data
  } catch (err) {
    if (err instanceof FirebaseError && err.code === 'functions/not-found') {
      throw new Error('Flyopslag er ikke sat op endnu (Cloud Function mangler).', { cause: err })
    }
    if (err instanceof FirebaseError && err.message) {
      throw new Error(err.message, { cause: err })
    }
    throw new Error('Kunne ikke slå flyet op lige nu.', { cause: err })
  }
}
