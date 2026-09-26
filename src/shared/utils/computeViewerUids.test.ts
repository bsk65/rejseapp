import { describe, expect, it } from 'vitest'
import { computeViewerUids } from './computeViewerUids'

describe('computeViewerUids', () => {
  it('returns all members when the category is shared', () => {
    expect(computeViewerUids(true, ['a', 'b', 'c'], 'a', 'b')).toEqual(['a', 'b', 'c'])
  })

  it('returns only the trip owner and creator when the category is not shared', () => {
    expect(computeViewerUids(false, ['a', 'b', 'c'], 'a', 'c')).toEqual(['a', 'c'])
  })

  it('does not duplicate when the trip owner is the creator', () => {
    expect(computeViewerUids(false, ['a', 'b'], 'a', 'a')).toEqual(['a'])
  })
})
