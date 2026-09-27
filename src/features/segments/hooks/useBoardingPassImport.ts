import { useState } from 'react'
import { formatDayDate } from '../../../shared/utils/date'
import type { Day } from '../../days/types'
import { lookupFlight } from '../api/flightLookup'
import { readBarcodeFromImage } from '../barcode'
import { flightToSegmentDetails, pickFlight } from '../logic/flightToDetails'
import { parseBoardingPass } from '../logic/parseBoardingPass'
import { planBoardingPass, type PlannedLeg } from '../logic/planBoardingPass'
import type { TicketEntry } from '../logic/tickets'
import { createSegment, updateSegment } from '../repository'
import type { SegmentDetails } from '../types'

/** Flyopslag er "nice to have" her — fejler det, gemmes boardingkortets egne data alligevel. */
async function tryLookup(plan: PlannedLeg): Promise<Partial<SegmentDetails>> {
  try {
    const flight = pickFlight(
      await lookupFlight(plan.flightNumber, plan.date),
      plan.leg.fromAirport,
    )
    return flight ? flightToSegmentDetails(flight) : {}
  } catch {
    return {}
  }
}

/** Fjerner felter, som det eksisterende segment allerede har — så man ikke overskriver egne rettelser. */
function onlyMissing(
  found: Partial<SegmentDetails>,
  existing: TicketEntry | undefined,
): Partial<SegmentDetails> {
  if (!existing) return found
  return Object.fromEntries(
    Object.entries(found).filter(
      ([key]) => existing.segment[key as keyof SegmentDetails] === undefined,
    ),
  ) as Partial<SegmentDetails>
}

/**
 * Scan boardingkort: aflæs stregkoden, find dag og evt. eksisterende fly, slå
 * resten op og gem. Returnerer beskeder til brugeren.
 */
export function useBoardingPassImport({
  tripId,
  days,
  entries,
  userUid,
  memberUids,
}: {
  tripId: string
  days: Day[]
  entries: TicketEntry[]
  userUid: string
  memberUids: string[]
}) {
  const [pending, setPending] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  async function importImage(file: File): Promise<void> {
    setPending(true)
    setError(null)
    setMessages([])
    try {
      const pass = parseBoardingPass(await readBarcodeFromImage(file))
      const reference = days[0] ? new Date(`${days[0].date}T12:00:00Z`) : new Date()
      const results: string[] = []

      for (const plan of planBoardingPass(pass, days, entries, reference)) {
        const label = `${plan.flightNumber} ${formatDayDate(plan.date)}`
        if (!plan.dayId) {
          results.push(`${label} ligger uden for rejsens datoer og blev ikke gemt.`)
          continue
        }
        const existing = entries.find((e) => e.segment.id === plan.existingSegmentId)
        const looked = await tryLookup(plan)
        const details: Partial<SegmentDetails> = {
          ...onlyMissing(looked, existing),
          ...(existing?.segment.number ? {} : { number: plan.flightNumber }),
          bookingRef: plan.leg.bookingRef,
          seat: plan.leg.seat,
          status: 'bekræftet',
          ...(looked.departurePlace || existing?.segment.freeText
            ? {}
            : { freeText: `${plan.leg.fromAirport} → ${plan.leg.toAirport}` }),
        }

        if (existing) {
          await updateSegment(tripId, plan.dayId, existing.segment.id, details)
          results.push(`${label} er opdateret${plan.leg.seat ? ` (sæde ${plan.leg.seat})` : ''}.`)
        } else {
          await createSegment(tripId, plan.dayId, userUid, memberUids, 'fly', details)
          results.push(`${label} er tilføjet${plan.leg.seat ? ` (sæde ${plan.leg.seat})` : ''}.`)
        }
      }
      setMessages(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke læse boardingkortet.')
    } finally {
      setPending(false)
    }
  }

  return { importImage, pending, messages, error }
}
