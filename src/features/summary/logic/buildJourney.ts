import type { Day } from '../../days/types'
import type { Photo } from '../../photos/types'
import { isRouteSource, type TrackPoint } from '../../tracking/types'
import { localIsoDate } from '../../../shared/utils/date'
import type { JourneyStop } from '../types'

/** Et lokalt klokkeslæt på en dags dato, som tidspunkt i ms. */
function timeOnDate(isoDate: string, clock: string): number {
  return new Date(`${isoDate}T${clock}`).getTime()
}

/**
 * Rutepunkter (GPS/import) fra kun én person pr. dag — den med flest punkter
 * den dag. Sporer to rejsefæller samme tur, ville afspilningen ellers hoppe
 * frem og tilbage mellem deres telefoner.
 */
export function pickOneTrackerPerDay(points: TrackPoint[]): TrackPoint[] {
  const countsByDate = new Map<string, Map<string, number>>()
  points.forEach((point) => {
    const date = localIsoDate(Date.parse(point.timestamp))
    const counts = countsByDate.get(date) ?? new Map<string, number>()
    counts.set(point.ownerUid, (counts.get(point.ownerUid) ?? 0) + 1)
    countsByDate.set(date, counts)
  })

  const chosenByDate = new Map<string, string>()
  countsByDate.forEach((counts, date) => {
    const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    chosenByDate.set(date, best[0])
  })

  return points.filter(
    (point) => chosenByDate.get(localIsoDate(Date.parse(point.timestamp))) === point.ownerUid,
  )
}

/**
 * Samler rejsen til én tidsordnet række af stop til afspilning: spor,
 * check-ins og billeder med position. Dage uden noget af det bidrager i
 * stedet med deres planlagte Fra/Til-steder, så en rejse, der kun er
 * planlagt, også kan afspilles.
 */
export function buildJourney(
  days: Day[],
  trackPoints: TrackPoint[],
  photos: Photo[],
): JourneyStop[] {
  const dayByDate = new Map(days.map((day) => [day.date, day]))
  const dayNumberAt = (time: number) => dayByDate.get(localIsoDate(time))?.dayNumber

  const routePoints = pickOneTrackerPerDay(trackPoints.filter((p) => isRouteSource(p.source)))
  const checkIns = trackPoints.filter((p) => p.source === 'manuel')

  const stops: JourneyStop[] = [
    ...routePoints.map((p): JourneyStop => {
      const time = Date.parse(p.timestamp)
      return { lat: p.lat, lng: p.lng, time, kind: 'spor', dayNumber: dayNumberAt(time) }
    }),
    ...checkIns.map((p): JourneyStop => {
      const time = Date.parse(p.timestamp)
      return {
        lat: p.lat,
        lng: p.lng,
        time,
        kind: 'checkin',
        dayNumber: dayNumberAt(time),
        label: p.label,
      }
    }),
  ]

  photos.forEach((photo) => {
    if (!photo.location) return
    const day = days.find((d) => d.id === photo.dayId)
    const time = photo.takenAt
      ? Date.parse(photo.takenAt)
      : day
        ? timeOnDate(day.date, '12:00:00')
        : NaN
    if (Number.isNaN(time)) return
    stops.push({
      ...photo.location,
      time,
      kind: 'foto',
      dayNumber: day?.dayNumber ?? dayNumberAt(time),
      photoId: photo.id,
      storagePath: photo.storagePath,
    })
  })

  const datesWithStops = new Set(stops.map((stop) => localIsoDate(stop.time)))
  days.forEach((day) => {
    if (datesWithStops.has(day.date)) return
    const places = [day.fromPlace, day.toPlace].filter((p) => p !== undefined)
    if (places.length === 2 && places[0].placeId === places[1].placeId) places.pop()
    places.forEach((place, index) => {
      stops.push({
        lat: place.lat,
        lng: place.lng,
        time: timeOnDate(day.date, index === 0 ? '09:00:00' : '18:00:00'),
        kind: 'sted',
        dayNumber: day.dayNumber,
        label: place.name,
      })
    })
  })

  return stops.sort((a, b) => a.time - b.time)
}
