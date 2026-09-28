import { useEffect, useState } from 'react'
import { getPhotoUrl } from '../repository'

/** Download-URL for et billede i Storage (null indtil den er hentet eller hvis det fejler). */
export function usePhotoUrl(storagePath: string): string | null {
  const [loaded, setLoaded] = useState<{ path: string; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    getPhotoUrl(storagePath)
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
