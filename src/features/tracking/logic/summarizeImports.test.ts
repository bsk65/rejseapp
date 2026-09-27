import { describe, expect, it } from 'vitest'
import type { TrackPoint } from '../types'
import { summarizeImports } from './summarizeImports'

function point(id: string, importId: string | undefined, timestamp: string): TrackPoint {
  return {
    id,
    lat: 0,
    lng: 0,
    timestamp,
    source: importId ? 'import' : 'gps',
    label: importId ? `Tur ${importId}` : undefined,
    importId,
    ownerUid: 'u',
    trackViewerUids: ['u'],
  }
}

describe('summarizeImports', () => {
  it('ignores live GPS points', () => {
    expect(summarizeImports([point('1', undefined, '2026-10-03T08:00:00Z')])).toEqual([])
  })

  it('groups points per import, oldest track first', () => {
    const summaries = summarizeImports([
      point('1', 'b', '2026-10-04T08:00:00Z'),
      point('2', 'a', '2026-10-03T09:00:00Z'),
      point('3', 'a', '2026-10-03T08:00:00Z'),
    ])
    expect(summaries.map((s) => [s.importId, s.pointCount, s.startedAt])).toEqual([
      ['a', 2, '2026-10-03T08:00:00Z'],
      ['b', 1, '2026-10-04T08:00:00Z'],
    ])
    expect(summaries[0].pointIds).toEqual(['2', '3'])
    expect(summaries[0].label).toBe('Tur a')
  })
})
