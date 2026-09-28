import type { LatLng } from '../../../shared/types/place'

type Vector = [number, number, number]

const toRad = (deg: number) => (deg * Math.PI) / 180
const toDeg = (rad: number) => (rad * 180) / Math.PI

function toVector({ lat, lng }: LatLng): Vector {
  const phi = toRad(lat)
  const lambda = toRad(lng)
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)]
}

function toLatLng([x, y, z]: Vector): LatLng {
  return { lat: toDeg(Math.atan2(z, Math.hypot(x, y))), lng: toDeg(Math.atan2(y, x)) }
}

/**
 * Punktet en brøkdel `fraction` (0-1) af vejen fra a til b langs storcirklen
 * — så en flyrejse på globus-kortet følger en bue, ikke en ret linje.
 */
export function interpolateGreatCircle(a: LatLng, b: LatLng, fraction: number): LatLng {
  const va = toVector(a)
  const vb = toVector(b)
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]))
  const omega = Math.acos(dot)
  // Tæt på hinanden (eller præcis modsat): lineært er både godt nok og stabilt.
  if (omega < 1e-6 || Math.PI - omega < 1e-6) {
    return { lat: a.lat + (b.lat - a.lat) * fraction, lng: a.lng + (b.lng - a.lng) * fraction }
  }
  const sinOmega = Math.sin(omega)
  const wa = Math.sin((1 - fraction) * omega) / sinOmega
  const wb = Math.sin(fraction * omega) / sinOmega
  return toLatLng([va[0] * wa + vb[0] * wb, va[1] * wa + vb[1] * wb, va[2] * wa + vb[2] * wb])
}

/**
 * Flytter en længdegrad med ±360°, så den ligger tættest på den forrige —
 * så en linje over datolinjen ikke tegnes hele vejen rundt om kloden.
 */
export function unwrapLng(previousLng: number, lng: number): number {
  let result = lng
  while (result - previousLng > 180) result -= 360
  while (result - previousLng < -180) result += 360
  return result
}
