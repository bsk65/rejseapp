import { useState } from 'react'
import { getLang } from '../../../shared/i18n/lang'
import { errorMessage, type Message } from '../../../shared/i18n/message'
import { localeFor } from '../../../shared/i18n/translate'
import { formatDayDate } from '../../../shared/utils/date'
import type { Day } from '../../days/types'
import { lookupFlight } from '../api/flightLookup'
import { readBarcodeFromImage } from '../barcode'
import { flightToSegmentDetails, pickFlight } from '../logic/flightToDetails'
import { parseBoardingPass } from '../logic/parseBoardingPass'
import { planBoardingPass, type PlannedLeg } from '../logic/planBoardingPass'
import type { TicketEntry } from '../logic/tickets'
import { withBoardingPass } from '../logic/boardingPassImages'
import {
  createSegment,
  deleteStorageFile,
  updateSegment,
  uploadBoardingPassImage,
} from '../repository'
import type { BoardingPassImage, SegmentDetails } from '../types'

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
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<Message | null>(null)

  async function importImage(file: File): Promise<void> {
    setPending(true)
    setError(null)
    setMessages([])
    try {
      const pass = parseBoardingPass(await readBarcodeFromImage(file))
      const reference = days[0] ? new Date(`${days[0].date}T12:00:00Z`) : new Date()
      const plans = planBoardingPass(pass, days, entries, reference)
      const results: Message[] = []
      const locale = localeFor(getLang())

      // Selve billedet gemmes også (én gang, også ved flere strækninger), så
      // boardingkortet kan vises ved gaten. Fejler det, gemmes flyet alligevel.
      const image: BoardingPassImage | undefined = plans.some((plan) => plan.dayId)
        ? await uploadBoardingPassImage(tripId, userUid, file)
            .then((storagePath) => ({
              storagePath,
              passengerName: pass.passengerName,
              ownerUid: userUid,
            }))
            .catch(() => {
              results.push({ key: 'segments.imageNotSaved' })
              return undefined
            })
        : undefined

      for (const plan of plans) {
        const label = `${plan.flightNumber} ${formatDayDate(plan.date, locale)}`
        const seat = plan.leg.seat
        if (!plan.dayId) {
          results.push({ key: 'segments.outsideTrip', params: { label } })
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
          ...(image
            ? { boardingPasses: withBoardingPass(existing?.segment.boardingPasses, image) }
            : {}),
          ...(looked.departurePlace || existing?.segment.freeText
            ? {}
            : { freeText: `${plan.leg.fromAirport} → ${plan.leg.toAirport}` }),
        }

        if (existing) {
          await updateSegment(tripId, plan.dayId, existing.segment.id, details)
          // Samme passager scannet igen: det gamle billede er erstattet i listen — slet filen.
          const replaced = (existing.segment.boardingPasses ?? []).filter(
            (old) => !details.boardingPasses?.some((kept) => kept.storagePath === old.storagePath),
          )
          await Promise.all(replaced.map((old) => deleteStorageFile(old.storagePath)))
          results.push(
            seat
              ? { key: 'segments.updatedSeat', params: { label, seat } }
              : { key: 'segments.updated', params: { label } },
          )
        } else {
          await createSegment(tripId, plan.dayId, userUid, memberUids, 'fly', details)
          results.push(
            seat
              ? { key: 'segments.addedSeat', params: { label, seat } }
              : { key: 'segments.added', params: { label } },
          )
        }
      }
      setMessages(results)
    } catch (err) {
      setError(errorMessage(err, 'segments.readFailed'))
    } finally {
      setPending(false)
    }
  }

  return { importImage, pending, messages, error }
}
