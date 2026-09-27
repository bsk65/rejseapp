import { useEffect, useRef, useState } from 'react'
import { DEFAULT_WARMUP_RULES, isGpsStable } from '../logic/isGpsStable'
import { DEFAULT_RECORDING_RULES, shouldRecordPoint, type GpsFix } from '../logic/shouldRecordPoint'
import { toGpsFix, describeGeolocationError } from '../geolocation'
import { useWakeLock } from './useWakeLock'

/**
 * Løbende GPS-sporing via navigator.geolocation.watchPosition. Efter start
 * gemmes intet, før GPS'en er stabil (isGpsStable) — derefter kaldes
 * `onRecord` kun for de målinger shouldRecordPoint vælger at gemme. Virker
 * kun mens appen er åben i forgrunden — browsere giver ikke en PWA
 * baggrunds-GPS.
 */
export function useGpsTracking(onRecord: (fix: GpsFix) => Promise<boolean>) {
  const [active, setActive] = useState(false)
  const [warmingUp, setWarmingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordedCount, setRecordedCount] = useState(0)
  const lastRecordedRef = useRef<GpsFix | null>(null)
  const recentFixesRef = useRef<GpsFix[]>([])
  const startedAtRef = useRef('')
  const onRecordRef = useRef(onRecord)

  useEffect(() => {
    onRecordRef.current = onRecord
  }, [onRecord])

  useWakeLock(active)

  useEffect(() => {
    if (!active) return

    let stable = false

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setError(null)
        const fix = toGpsFix(position)
        if (
          fix.accuracy !== undefined &&
          fix.accuracy > DEFAULT_RECORDING_RULES.maxAccuracyMeters
        ) {
          return
        }

        if (!stable) {
          recentFixesRef.current = [...recentFixesRef.current, fix].slice(
            -DEFAULT_WARMUP_RULES.stableFixes,
          )
          if (!isGpsStable(recentFixesRef.current, startedAtRef.current)) return
          stable = true
          setWarmingUp(false)
        }

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
      // maximumAge 0: aldrig en gemt (evt. grov) position fra før sporingen startede.
      { enableHighAccuracy: true, maximumAge: 0 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [active])

  function start() {
    if (!('geolocation' in navigator)) {
      setError('Din browser understøtter ikke GPS-sporing.')
      return
    }
    lastRecordedRef.current = null
    recentFixesRef.current = []
    startedAtRef.current = new Date().toISOString()
    setRecordedCount(0)
    setError(null)
    setWarmingUp(true)
    setActive(true)
  }

  function stop() {
    setActive(false)
    setWarmingUp(false)
  }

  return { active, warmingUp, start, stop, error, recordedCount }
}
