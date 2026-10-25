import { useEffect, useRef, useState } from 'react'
import type { Message } from '../../../shared/i18n/message'
import { deleteStorageFile, uploadBoardingPassImage } from '../../segments/repository'
import type { BoardingPassImage } from '../../segments/types'

/**
 * Billetter/bekræftelser i reservationsformularen. Filen lægges i Storage med
 * det samme, men listen gemmes først med reservationen (Gem) — så det også
 * virker på en ny reservation, der ikke har et id endnu. Uploadet, men ikke
 * gemt → filen slettes igen, når formularen lukkes. Fjernet → filen slettes
 * først, når der er gemt (ellers kunne Annuller ikke fortryde).
 */
export function useReservationTickets(tripId: string, initial: BoardingPassImage[] | undefined) {
  const [tickets, setTickets] = useState<BoardingPassImage[]>(initial ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Message | null>(null)
  const unsaved = useRef<string[]>([])
  const removed = useRef<string[]>([])

  useEffect(
    () => () => {
      unsaved.current.forEach((path) => void deleteStorageFile(path))
      unsaved.current = []
    },
    [],
  )

  async function add(file: File, passengerName: string, ownerUid: string): Promise<void> {
    setUploading(true)
    setError(null)
    try {
      const storagePath = await uploadBoardingPassImage(tripId, ownerUid, file, 'billet')
      unsaved.current.push(storagePath)
      setTickets((prev) => [
        ...prev,
        {
          storagePath,
          passengerName,
          ownerUid,
          kind: 'billet',
          contentType: file.type || 'image/jpeg',
        },
      ])
    } catch {
      setError({ key: 'segments.ticketNotSaved' })
    } finally {
      setUploading(false)
    }
  }

  async function remove(ticket: BoardingPassImage): Promise<void> {
    setTickets((prev) => prev.filter((t) => t.storagePath !== ticket.storagePath))
    if (unsaved.current.includes(ticket.storagePath)) {
      unsaved.current = unsaved.current.filter((path) => path !== ticket.storagePath)
      await deleteStorageFile(ticket.storagePath)
    } else {
      removed.current.push(ticket.storagePath)
    }
  }

  /** Reservationen er gemt med listen: nye filer beholdes, fjernede slettes. */
  async function saved(): Promise<void> {
    unsaved.current = []
    await Promise.all(removed.current.map((path) => deleteStorageFile(path)))
    removed.current = []
  }

  /** Reservationen er slettet: alle dens filer slettes også. */
  async function deletedAll(): Promise<void> {
    const paths = [...tickets.map((t) => t.storagePath), ...removed.current]
    unsaved.current = []
    removed.current = []
    await Promise.all(paths.map((path) => deleteStorageFile(path)))
  }

  return { tickets, uploading, error, add, remove, saved, deletedAll }
}
