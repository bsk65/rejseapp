import { formatDayDate } from '../../../shared/utils/date'
import { useState } from 'react'
import { lookupFlight } from '../api/flightLookup'
import { flightToSegmentDetails, pickFlight } from '../logic/flightToDetails'
import type { SegmentDetails } from '../types'

export function useFlightLookup() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Slår flyet op og returnerer de felter, der kan udfyldes — eller undefined. */
  async function lookup(
    flightNumber: string,
    date: string,
    fromAirport?: string,
  ): Promise<Partial<SegmentDetails> | undefined> {
    setPending(true)
    setError(null)
    try {
      const flight = pickFlight(await lookupFlight(flightNumber, date), fromAirport)
      if (!flight) {
        setError(
          `Fandt ikke ${flightNumber} ${formatDayDate(date)}. Flyver det en anden dag, eller er flynummeret forkert?`,
        )
        return undefined
      }
      return flightToSegmentDetails(flight)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke slå flyet op.')
      return undefined
    } finally {
      setPending(false)
    }
  }

  return { lookup, pending, error }
}
