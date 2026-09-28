import { useEffect, useState } from 'react'
import { getStorageUrl } from '../api/storage'

/**
 * Download-URL for en fil i Storage (billede, boardingkort) — null indtil den
 * er hentet, eller hvis det fejler.
 */
export function useStorageUrl(storagePath: string): string | null {
  const [loaded, setLoaded] = useState<{ path: string; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getStorageUrl(storagePath)
      .then((url) => {
        if (!cancelled) setLoaded({ path: storagePath, url })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [storagePath])

  // En URL hentet til et tidligere storagePath må ikke vises for det nye.
  return loaded?.path === storagePath ? loaded.url : null
}
