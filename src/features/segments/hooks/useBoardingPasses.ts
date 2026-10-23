import { useState } from 'react'
import { errorMessage, type Message } from '../../../shared/i18n/message'
import { readBarcodeFromImage } from '../barcode'
import { withBoardingPass } from '../logic/boardingPassImages'
import { legForFlight } from '../logic/legForFlight'
import { matchPassenger } from '../logic/matchPassenger'
import { parseBoardingPass } from '../logic/parseBoardingPass'
import {
  deleteStorageFile,
  removeBoardingPass,
  saveBoardingPasses,
  updateSegment,
  uploadBoardingPassImage,
} from '../repository'
import type { BoardingPassImage, Segment, SegmentDetails } from '../types'

/**
 * Segmentets gemte boardingkort/billetter, som formularen viser — upload af en
 * billet, scanning af et boardingkort og fjernelse. Listen holdes lokalt, fordi
 * formularens segment er et øjebliksbillede fra da den blev åbnet (ellers ville
 * to ændringer i træk genskabe den første).
 */
export function useBoardingPasses(tripId: string, dayId: string, segment: Segment) {
  const [passes, setPasses] = useState<BoardingPassImage[]>(segment.boardingPasses ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Message | null>(null)

  async function remove(pass: BoardingPassImage): Promise<void> {
    const remaining = passes.filter((p) => p.storagePath !== pass.storagePath)
    await removeBoardingPass(tripId, dayId, segment.id, remaining, pass.storagePath)
    setPasses(remaining)
  }

  /** Billet (billede eller PDF). Lægges til listen — man kan have flere (billet + pladsbillet). */
  async function addTicket(file: File, passengerName: string, ownerUid: string): Promise<void> {
    setUploading(true)
    setError(null)
    try {
      const storagePath = await uploadBoardingPassImage(tripId, ownerUid, file, 'billet')
      const next: BoardingPassImage[] = [
        ...passes,
        {
          storagePath,
          passengerName,
          ownerUid,
          kind: 'billet',
          contentType: file.type || 'image/jpeg',
        },
      ]
      await saveBoardingPasses(tripId, dayId, segment.id, next)
      setPasses(next)
    } catch {
      setError({ key: 'segments.ticketNotSaved' })
    } finally {
      setUploading(false)
    }
  }

  /**
   * Boardingkort scannet direkte på flyet: stregkoden skal passe til flyets nummer.
   * Kortet gemmes sammen med sæde, bookingnummer og passageren som rejsende;
   * de gemte felter returneres, så formularen kan vise dem.
   */
  async function scanBoardingPass(
    file: File,
    {
      flightNumber,
      travelers,
      people,
      selfUid,
    }: {
      flightNumber: string | undefined
      travelers: string[]
      people: { uid: string; name: string }[]
      selfUid: string
    },
  ): Promise<Partial<SegmentDetails> | undefined> {
    setUploading(true)
    setError(null)
    try {
      const pass = parseBoardingPass(await readBarcodeFromImage(file))
      const leg = legForFlight(pass, flightNumber)
      const passengerUid = matchPassenger(pass.passengerName, people) ?? selfUid
      const storagePath = await uploadBoardingPassImage(tripId, selfUid, file)
      const next = withBoardingPass(passes, {
        storagePath,
        passengerName: pass.passengerName,
        ownerUid: selfUid,
      })
      const patch: Partial<SegmentDetails> = {
        ...(flightNumber ? {} : { number: `${leg.carrier}${leg.flightNumber}` }),
        ...(leg.seat ? { seat: leg.seat } : {}),
        ...(leg.bookingRef ? { bookingRef: leg.bookingRef } : {}),
        status: 'bekræftet',
        travelerUids: [...new Set([...travelers, passengerUid])],
      }
      await updateSegment(tripId, dayId, segment.id, { ...patch, boardingPasses: next })
      // Samme passager scannet igen: det gamle kort er erstattet i listen — slet filen.
      const replaced = passes.filter(
        (old) => !next.some((kept) => kept.storagePath === old.storagePath),
      )
      await Promise.all(replaced.map((old) => deleteStorageFile(old.storagePath)))
      setPasses(next)
      return patch
    } catch (err) {
      setError(errorMessage(err, 'segments.readFailed'))
      return undefined
    } finally {
      setUploading(false)
    }
  }

  return { passes, remove, addTicket, scanBoardingPass, uploading, error }
}
