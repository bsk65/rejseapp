import { useEffect } from 'react'
import { saveFileOffline } from '../../../shared/api/offlineFiles'
import type { BoardingPassImage } from '../types'

/**
 * Gemmer en kopi af rejsens boardingkort og billetter på enheden, mens der er
 * forbindelse — så de kan vises ved gaten/i toget, selvom nettet er væk.
 * Allerede gemte filer hentes ikke igen.
 */
export function useOfflinePasses(passes: BoardingPassImage[]): void {
  const pathsKey = passes
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
