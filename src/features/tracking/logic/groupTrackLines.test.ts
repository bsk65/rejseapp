import { describe, expect, it } from 'vitest'
import type { TrackPoint } from '../types'
import { groupTrackLines } from './groupTrackLines'

function point(ownerUid: string, lat: number, timestamp: string): TrackPoint {
  return {
    id: `${ownerUid}-${timestamp}`,
    lat,
    lng: 0,
    timestamp,
    source: 'gps',
    ownerUid,
    trackViewerUids: [ownerUid],
  }
}

describe('groupTrackLines', () => {
  it('returns no lines for no points', () => {
    expect(groupTrackLines([])).toEqual([])
  })

  it('splits points into one time-sorted line per person', () => {
    const lines = groupTrackLines([
      point('a', 2, '2026-09-26T11:00:00Z'),
      point('b', 10, '2026-09-26T10:00:00Z'),
      point('a', 1, '2026-09-26T10:00:00Z'),
    ])
    expect(lines).toEqual([
      [
        { lat: 1, lng: 0 },
        { lat: 2, lng: 0 },
      ],
      [{ lat: 10, lng: 0 }],
    ])
  })
})
