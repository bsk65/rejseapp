import { TextError } from '../../shared/i18n/message'
import type { TextKey } from '../../shared/i18n/translator'
import type { GpsFix } from './logic/shouldRecordPoint'

/** Omsætter browserens GeolocationPosition til vores rene GpsFix-type. */
export function toGpsFix(position: GeolocationPosition): GpsFix {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date(position.timestamp).toISOString(),
  }
}

export function describeGeolocationError(error: GeolocationPositionError): TextKey {
  if (error.code === error.PERMISSION_DENIED) return 'tracking.errorPermission'
  if (error.code === error.TIMEOUT) return 'tracking.errorTimeout'
  return 'tracking.errorPosition'
}

/** Check-ins tåler lidt mere usikkerhed end løbende sporing (indendørs er GPS ofte 20-100 m). */
const MAX_CHECK_IN_ACCURACY_METERS = 100

/** Engangs-position til "Check ind her". Afviser en for upræcis position. */
export function getCurrentFix(): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new TextError('tracking.errorNoGps'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fix = toGpsFix(position)
        if (fix.accuracy !== undefined && fix.accuracy > MAX_CHECK_IN_ACCURACY_METERS) {
          reject(new TextError('tracking.errorInaccurate', { m: Math.round(fix.accuracy) }))
          return
        }
        resolve(fix)
      },
      (err) => reject(new TextError(describeGeolocationError(err))),
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    )
  })
}
