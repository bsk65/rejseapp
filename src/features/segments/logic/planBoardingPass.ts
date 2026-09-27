import type { Day } from '../../days/types'
import { compactFlightNumber } from './flightToDetails'
import { dayOfYearToIsoDate, type BoardingPass, type BoardingPassLeg } from './parseBoardingPass'
import type { TicketEntry } from './tickets'

export type PlannedLeg = {
  leg: BoardingPassLeg
  /** "SK1415" */
  flightNumber: string
  /** YYYY-MM-DD */
  date: string
  /** Den dag i rejsen, flyet hører til — undefined hvis datoen ligger uden for rejsen. */
  dayId?: string
  /** Et eksisterende fly-segment samme dag med samme flynummer, der skal opdateres. */
  existingSegmentId?: string
}

/**
 * Finder ud af, hvor hver strækning på et boardingkort hører hjemme: hvilken
 * dag (ud fra datoen), og om flyet allerede er oprettet den dag — så det
 * opdateres i stedet for at blive oprettet to gange.
 */
export function planBoardingPass(
  pass: BoardingPass,
  days: Day[],
  existing: TicketEntry[],
  reference: Date,
): PlannedLeg[] {
  return pass.legs.map((leg) => {
    const flightNumber = compactFlightNumber(`${leg.carrier}${leg.flightNumber}`)
    const date = dayOfYearToIsoDate(leg.dayOfYear, reference)
    const day = days.find((d) => d.date === date)
    const match = day
      ? existing.find(
          (entry) =>
            entry.dayId === day.id &&
            entry.segment.mode === 'fly' &&
            compactFlightNumber(entry.segment.number) === flightNumber,
        )
      : undefined
    return { leg, flightNumber, date, dayId: day?.id, existingSegmentId: match?.segment.id }
  })
}
