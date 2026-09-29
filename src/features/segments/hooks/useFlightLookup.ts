import { useState } from 'react'
import { getLang } from '../../../shared/i18n/lang'
import { errorMessage, type Message } from '../../../shared/i18n/message'
import { localeFor } from '../../../shared/i18n/translate'
import { formatDayDate } from '../../../shared/utils/date'
import { lookupFlight } from '../api/flightLookup'
import { flightToSegmentDetails, pickFlight } from '../logic/flightToDetails'
import type { SegmentDetails } from '../types'

export function useFlightLookup() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<Message | null>(null)

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
        setError({
          key: 'segments.lookupNotFound',
          params: { flight: flightNumber, date: formatDayDate(date, localeFor(getLang())) },
        })
        return undefined
      }
      return flightToSegmentDetails(flight)
    } catch (err) {
      setError(errorMessage(err, 'segments.lookupFailed'))
      return undefined
    } finally {
      setPending(false)
    }
  }

  return { lookup, pending, error }
}
