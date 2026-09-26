import { describe, expect, it } from 'vitest'
import { computePhotoViewerUids } from './computePhotoViewerUids'

describe('computePhotoViewerUids', () => {
  it('returns all members when photos are shared', () => {
    expect(computePhotoViewerUids(true, ['a', 'b', 'c'], 'a', 'b')).toEqual(['a', 'b', 'c'])
  })

  it('returns only the owner and uploader when photos are not shared', () => {
    expect(computePhotoViewerUids(false, ['a', 'b', 'c'], 'a', 'c')).toEqual(['a', 'c'])
  })

  it('does not duplicate when the owner is the uploader', () => {
    expect(computePhotoViewerUids(false, ['a', 'b'], 'a', 'a')).toEqual(['a'])
  })
})
