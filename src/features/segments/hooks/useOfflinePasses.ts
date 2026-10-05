import { useEffect } from 'react'
import { saveFileOffline } from '../../../shared/api/offlineFiles'
import type { TicketEntry } from '../logic/tickets'

/**
 * Gemmer en kopi af rejsens boardingkort og billetter på enheden, mens der er
 * forbindelse — så de kan vises ved gaten/i toget, selvom nettet er væk.
 * Allerede gemte filer hentes ikke igen.
 */
export function useOfflinePasses(entries: TicketEntry[]): void {
  const pathsKey = entries
    .flatMap((entry) => entry.segment.boardingPasses ?? [])
    .map((pass) => pass.storagePath)
    .sort()
    .join('|')

  useEffect(() => {
    if (!pathsKey || !navigator.onLine) return
    for (const path of pathsKey.split('|')) {
      void saveFileOffline(path).catch(() => undefined)
    }
  }, [pathsKey])
}
