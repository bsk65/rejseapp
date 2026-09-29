import { describe, expect, it } from 'vitest'
import { displayNameOf } from './displayName'

describe('displayNameOf', () => {
  it('uses the chosen name', () => {
    expect(displayNameOf({ uid: 'a', email: 'lars@x.dk', displayName: ' Lars ' })).toBe('Lars')
  })

  it('falls back to the first part of the email', () => {
    expect(displayNameOf({ uid: 'a', email: 'lars.hansen@x.dk' })).toBe('lars.hansen')
    expect(displayNameOf({ uid: 'a', email: 'lars.hansen@x.dk', displayName: '  ' })).toBe(
      'lars.hansen',
    )
  })

  it('is undefined for a missing profile', () => {
    expect(displayNameOf(undefined)).toBeUndefined()
  })
})
