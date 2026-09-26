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

/** Engangs-position til "Check ind her". */
export function getCurrentFix(): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Din browser understøtter ikke GPS.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toGpsFix(position)),
      (err) => reject(new Error(describeGeolocationError(err))),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 },
    )
  })
}
