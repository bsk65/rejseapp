import { describe, expect, it } from 'vitest'
import type { JourneyStop, StopKind } from '../types'
import { buildTimeline, stateAt, zoomForLegKm } from './timeline'

function stop(lat: number, lng: number, kind: StopKind = 'spor'): JourneyStop {
  return { lat, lng, kind, time: 0 }
}

describe('buildTimeline', () => {
  it('handles a single stop', () => {
    const timeline = buildTimeline([stop(55, 10)])
    expect(timeline.duration).toBe(0)
    expect(timeline.cumulativeKm).toEqual([0])
  })

  it('keeps total movement time between 15 and 90 seconds', () => {
    const short = buildTimeline([stop(55, 10), stop(55.001, 10)])
    expect(short.duration).toBeCloseTo(15_000)

    const many = Array.from({ length: 2000 }, (_, i) => stop(55 + i * 0.01, 10))
    expect(buildTimeline(many).duration).toBeCloseTo(90_000)
  })

  it('pauses at photos and check-ins', () => {
    const timeline = buildTimeline([stop(55, 10), stop(55.1, 10, 'foto'), stop(55.2, 10)])
    const holds = timeline.entries.filter((e) => e.kind === 'hold')
    expect(holds).toEqual([expect.objectContaining({ stop: 1 })])
    expect(timeline.duration).toBeCloseTo(15_000 + 2500)
  })

  it('accumulates distance', () => {
    const timeline = buildTimeline([stop(55, 10), stop(56, 10), stop(57, 10)])
    expect(timeline.cumulativeKm[1]).toBeCloseTo(111.2, 0)
    expect(timeline.cumulativeKm[2]).toBeCloseTo(222.4, 0)
  })
})

describe('stateAt', () => {
  const stops = [stop(55, 10), stop(56, 10, 'foto'), stop(57, 10)]
  const timeline = buildTimeline(stops)

  it('starts at the first stop and ends at the last', () => {
    expect(stateAt(stops, timeline, 0).position).toEqual({ lat: 55, lng: 10 })
    const end = stateAt(stops, timeline, timeline.duration + 1)
    expect(end.stopIndex).toBe(2)
    expect(end.km).toBeCloseTo(222.4, 0)
  })

  it('is halfway along a leg halfway through its move', () => {
    const move = timeline.entries[0]
    const state = stateAt(stops, timeline, (move.start + move.end) / 2)
    expect(state.position.lat).toBeCloseTo(55.5, 3)
    expect(state.km).toBeCloseTo(55.6, 0)
    expect(state.legFraction).toBeCloseTo(0.5)
    expect(state.holdingStop).toBeNull()
  })

  it('reports the photo being held', () => {
    const hold = timeline.entries.find((e) => e.kind === 'hold')
    expect(hold).toBeDefined()
    if (!hold) return
    expect(stateAt(stops, timeline, hold.start + 10).holdingStop).toBe(1)
  })
})

describe('zoomForLegKm', () => {
  it('zooms out for long legs and in for short ones, within limits', () => {
    expect(zoomForLegKm(5000)).toBeLessThan(zoomForLegKm(10))
    expect(zoomForLegKm(20_000)).toBe(2)
    expect(zoomForLegKm(0)).toBe(15)
  })
})
