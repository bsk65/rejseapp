import { useEffect, useRef, useState } from 'react'
import { shouldRecordPoint, type GpsFix } from '../logic/shouldRecordPoint'
import { toGpsFix, describeGeolocationError } from '../geolocation'
import { useWakeLock } from './useWakeLock'

/**
 * Løbende GPS-sporing via navigator.geolocation.watchPosition. Kalder
 * `onRecord` kun for de målinger shouldRecordPoint vælger at gemme. Virker
 * kun mens appen er åben i forgrunden — browsere giver ikke en PWA
 * baggrunds-GPS.
 */
export function useGpsTracking(onRecord: (fix: GpsFix) => Promise<boolean>) {
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordedCount, setRecordedCount] = useState(0)
  const lastRecordedRef = useRef<GpsFix | null>(null)
  const onRecordRef = useRef(onRecord)

  useEffect(() => {
    onRecordRef.current = onRecord
  }, [onRecord])

  useWakeLock(active)

  useEffect(() => {
    if (!active) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setError(null)
        const fix = toGpsFix(position)
        if (!shouldRecordPoint(lastRecordedRef.current, fix)) return
        lastRecordedRef.current = fix
        void onRecordRef.current(fix).then((ok) => {
          if (ok) setRecordedCount((count) => count + 1)
        })
      },
      (err) => {
        setError(describeGeolocationError(err))
        if (err.code === err.PERMISSION_DENIED) setActive(false)
      },
      { enableHighAccuracy: true, maximumAge: 10_000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [active])

  function start() {
    if (!('geolocation' in navigator)) {
      setError('Din browser understøtter ikke GPS-sporing.')
      return
    }
    lastRecordedRef.current = null
    setRecordedCount(0)
    setError(null)
    setActive(true)
  }

  function stop() {
    setActive(false)
  }

  return { active, start, stop, error, recordedCount }
}
