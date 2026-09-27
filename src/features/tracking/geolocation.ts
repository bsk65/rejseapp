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

export function describeGeolocationError(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Appen har ikke adgang til din position. Tillad placering i browserens indstillinger.'
  }
  if (error.code === error.TIMEOUT) {
    return 'Det tog for lang tid at finde din position. Prøv igen.'
  }
  return 'Kunne ikke finde din position lige nu.'
}

/** Check-ins tåler lidt mere usikkerhed end løbende sporing (indendørs er GPS ofte 20-100 m). */
const MAX_CHECK_IN_ACCURACY_METERS = 100

/** Engangs-position til "Check ind her". Afviser en for upræcis position. */
export function getCurrentFix(): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Din browser understøtter ikke GPS.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const fix = toGpsFix(position)
        if (fix.accuracy !== undefined && fix.accuracy > MAX_CHECK_IN_ACCURACY_METERS) {
          reject(
            new Error(
              `Positionen er for upræcis lige nu (±${Math.round(fix.accuracy)} m). Vent lidt og prøv igen, eller check ind via søgning.`,
            ),
          )
          return
        }
        resolve(fix)
      },
      (err) => reject(new Error(describeGeolocationError(err))),
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    )
  })
}
