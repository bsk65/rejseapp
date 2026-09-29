import { FirebaseError } from 'firebase/app'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../../../firebase/config'
import { TextError } from '../../../shared/i18n/message'
import type { TextKey } from '../../../shared/i18n/translator'

/** Cloud Function'ens fejlkoder → beskeder på brugerens sprog. */
const FUNCTION_ERROR_KEYS: Record<string, TextKey> = {
  'functions/not-found': 'segments.lookupNotSetUp',
  'functions/invalid-argument': 'segments.lookupInvalid',
  'functions/resource-exhausted': 'segments.lookupTooMany',
  'functions/unavailable': 'segments.lookupUnavailable',
}

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
    // Cloud Function'ens egne beskeder er på dansk — vis i stedet en oversat
    // besked ud fra fejlkoden.
    const code = err instanceof FirebaseError ? err.code : undefined
    throw new TextError(FUNCTION_ERROR_KEYS[code ?? ''] ?? 'segments.lookupFailed', undefined, {
      cause: err,
    })
  }
}
