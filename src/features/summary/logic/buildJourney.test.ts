import { describe, expect, it } from 'vitest'
import type { Day } from '../../days/types'
import type { Photo } from '../../photos/types'
import type { TrackPoint, TrackSource } from '../../tracking/types'
import { buildJourney, localIsoDate, pickOneTrackerPerDay } from './buildJourney'

const odense = { name: 'Odense', lat: 55.4, lng: 10.39, placeId: 'odense' }
const rome = { name: 'Rom', lat: 41.9, lng: 12.5, placeId: 'rome' }

function day(dayNumber: number, date: string, extra: Partial<Day> = {}): Day {
  return { id: `d${dayNumber}`, dayNumber, date, ownerUid: 'a', memberUids: ['a'], ...extra }
}

/** Middag lokal tid, så datoen er den samme uanset testmaskinens tidszone. */
function localNoon(date: string, minutes = 0): string {
  return new Date(new Date(`${date}T12:00:00`).getTime() + minutes * 60_000).toISOString()
}

function point(
  id: string,
  timestamp: string,
  ownerUid = 'a',
  source: TrackSource = 'gps',
  label?: string,
): TrackPoint {
  return { id, lat: 55, lng: 10, timestamp, source, ownerUid, trackViewerUids: [ownerUid], label }
}

function photo(id: string, extra: Partial<Photo>): Photo {
  return {
    id,
    storagePath: `trips/t/a/${id}`,
    ownerUid: 'a',
    photoViewerUids: ['a'],
    uploadedAt: null,
    ...extra,
  }
}

describe('localIsoDate', () => {
  it('formats the local calendar date', () => {
    expect(localIsoDate(new Date(2026, 9, 4, 23, 30).getTime())).toBe('2026-10-04')
  })
})

describe('pickOneTrackerPerDay', () => {
  it('keeps only the person with most points each day', () => {
    const points = [
      point('1', localNoon('2026-10-04', 0), 'a'),
      point('2', localNoon('2026-10-04', 1), 'b'),
      point('3', localNoon('2026-10-04', 2), 'b'),
      point('4', localNoon('2026-10-05', 0), 'a'),
    ]
    expect(pickOneTrackerPerDay(points).map((p) => p.id)).toEqual(['2', '3', '4'])
  })
})

describe('buildJourney', () => {
  it('returns nothing for an empty trip', () => {
    expect(buildJourney([day(1, '2026-10-04')], [], [])).toEqual([])
  })

  it('uses planned places for days without tracks or photos', () => {
    const stops = buildJourney(
      [
        day(1, '2026-10-04', { fromPlace: odense, toPlace: rome }),
        day(2, '2026-10-05', { fromPlace: rome, toPlace: rome }),
      ],
      [],
      [],
    )
    expect(stops.map((s) => [s.label, s.dayNumber, s.kind])).toEqual([
      ['Odense', 1, 'sted'],
      ['Rom', 1, 'sted'],
      ['Rom', 2, 'sted'],
    ])
  })

  it('skips planned places on a day that has a track', () => {
    const stops = buildJourney(
      [day(1, '2026-10-04', { fromPlace: odense, toPlace: rome })],
      [point('1', localNoon('2026-10-04'))],
      [],
    )
    expect(stops).toHaveLength(1)
    expect(stops[0].kind).toBe('spor')
    expect(stops[0].dayNumber).toBe(1)
  })

  it('sorts track points, check-ins and photos by time', () => {
    const stops = buildJourney(
      [day(1, '2026-10-04')],
      [
        point('late', localNoon('2026-10-04', 30)),
        point('checkin', localNoon('2026-10-04', 10), 'a', 'manuel', 'Colosseum'),
        point('early', localNoon('2026-10-04', 0)),
      ],
      [photo('p', { takenAt: localNoon('2026-10-04', 20), location: { lat: 41.89, lng: 12.49 } })],
    )
    expect(stops.map((s) => s.kind)).toEqual(['spor', 'checkin', 'foto', 'spor'])
    expect(stops[1].label).toBe('Colosseum')
    expect(stops[2].photoId).toBe('p')
  })

  it('ignores photos without position, and without time unless they belong to a day', () => {
    const stops = buildJourney(
      [day(1, '2026-10-04')],
      [],
      [
        photo('noPlace', { takenAt: localNoon('2026-10-04') }),
        photo('noTime', { location: { lat: 1, lng: 2 } }),
        photo('dayOnly', { location: { lat: 1, lng: 2 }, dayId: 'd1' }),
      ],
    )
    expect(stops.map((s) => s.photoId)).toEqual(['dayOnly'])
    expect(stops[0].dayNumber).toBe(1)
  })
})
