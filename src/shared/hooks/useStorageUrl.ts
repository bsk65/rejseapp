import { useEffect, useState } from 'react'
import { offlineFileUrl } from '../api/offlineFiles'
import { getStorageUrl } from '../api/storage'

/**
 * Adresse til en fil i Storage (billede, boardingkort) — null indtil den er
 * fundet, eller hvis det fejler. Er filen gemt på enheden (boardingkort og
 * billetter, se offlineFiles.ts), bruges kopien — den virker også uden
 * forbindelse.
 */
export function useStorageUrl(storagePath: string): string | null {
  const [loaded, setLoaded] = useState<{ path: string; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    let blobUrl: string | null = null
    offlineFileUrl(storagePath)
      .catch(() => null)
      .then((offline) => {
        blobUrl = offline
        return offline ?? getStorageUrl(storagePath)
      })
      .then((url) => {
        if (!cancelled) setLoaded({ path: storagePath, url })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [storagePath])

  // En URL hentet til et tidligere storagePath må ikke vises for det nye.
  return loaded?.path === storagePath ? loaded.url : null
}
