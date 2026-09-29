import { describe, expect, it } from 'vitest'
import { matchPassenger } from './matchPassenger'

const people = [
  { uid: 'me', name: 'Bjarne Stubkjær Klausen' },
  { uid: 'lars', name: 'Lars Hansen' },
  { uid: 'noname', name: 'eva.j' },
]

describe('matchPassenger', () => {
  it('matches surname and first name, ignoring the title', () => {
    expect(matchPassenger('KLAUSEN/BJARNE MR', people)).toBe('me')
    expect(matchPassenger('HANSEN/LARS', people)).toBe('lars')
  })

  it('understands æ/ø/å spelled out in the barcode', () => {
    expect(
      matchPassenger('STUBKJAER KLAUSEN/BJARNE', [{ uid: 'me', name: 'Bjarne Stubkjær Klausen' }]),
    ).toBe('me')
  })

  it('returns undefined when nobody matches', () => {
    expect(matchPassenger('JENSEN/EVA MS', people)).toBeUndefined()
    expect(matchPassenger('', people)).toBeUndefined()
  })

  it('returns undefined when the match is ambiguous', () => {
    expect(
      matchPassenger('HANSEN/LARS', [
        { uid: 'a', name: 'Lars Hansen' },
        { uid: 'b', name: 'Lars Peter Hansen' },
      ]),
    ).toBeUndefined()
  })
})
