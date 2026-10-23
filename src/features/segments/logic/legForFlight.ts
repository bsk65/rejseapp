import { TextError } from '../../../shared/i18n/message'
import { compactFlightNumber } from './flightToDetails'
import type { BoardingPass, BoardingPassLeg } from './parseBoardingPass'

function legNumber(leg: BoardingPassLeg): string {
  return compactFlightNumber(`${leg.carrier}${leg.flightNumber}`)
}

/**
 * Finder strækningen på boardingkortet, der hører til det fly, man har åbnet.
 * Uden flynummer på flyet bruges kortets eneste strækning. Passer intet, kastes
 * en fejl, så kortet ikke lægges på det forkerte fly.
 */
export function legForFlight(
  pass: BoardingPass,
  flightNumber: string | undefined,
): BoardingPassLeg {
  const flights = pass.legs.map(legNumber).join(', ')
  if (!flightNumber) {
    if (pass.legs.length === 1) return pass.legs[0]
    throw new TextError('segments.passPickFlight', { flights })
  }
  const wanted = compactFlightNumber(flightNumber)
  const leg = pass.legs.find((l) => legNumber(l) === wanted)
  if (!leg) throw new TextError('segments.passWrongFlight', { flights })
  return leg
}
