import { describe, expect, it } from 'vitest'
import { shouldRecordPoint, type GpsFix } from './shouldRecordPoint'

const start: GpsFix = { lat: 55.4, lng: 10.4, timestamp: '2026-09-26T10:00:00.000Z' }

describe('shouldRecordPoint', () => {
  it('records the first fix', () => {
    expect(shouldRecordPoint(null, start)).toBe(true)
  })

  it('skips imprecise fixes, even the first one', () => {
    expect(shouldRecordPoint(null, { ...start, accuracy: 500 })).toBe(false)
  })

  it('records when moved far enough', () => {
    // ~0.002 grader bredde ≈ 222 m
    const next = { lat: 55.402, lng: 10.4, timestamp: '2026-09-26T10:01:00.000Z' }
    expect(shouldRecordPoint(start, next)).toBe(true)
  })

  it('skips small movements shortly after the last point', () => {
    const next = { lat: 55.4001, lng: 10.4, timestamp: '2026-09-26T10:05:00.000Z' }
    expect(shouldRecordPoint(start, next)).toBe(false)
  })

  it('records when standing still for long enough', () => {
    const next = { ...start, timestamp: '2026-09-26T10:15:00.000Z' }
    expect(shouldRecordPoint(start, next)).toBe(true)
  })
})
