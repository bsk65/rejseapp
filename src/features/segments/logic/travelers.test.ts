import { describe, expect, it } from 'vitest'
import { isTravelling, toggleTraveler, travelersLabel, travelersOf } from './travelers'

const names: Record<string, string> = { me: 'Bjarne', lars: 'Lars', eva: 'Eva' }
const nameOf = (uid: string) => names[uid]
const labels = { everyone: 'Alle', you: 'Dig' }

describe('travelersOf', () => {
  it('falls back to the creator for older segments', () => {
    expect(travelersOf({ ownerUid: 'me' })).toEqual(['me'])
    expect(travelersOf({ ownerUid: 'me', travelerUids: [] })).toEqual(['me'])
  })

  it('uses the chosen travellers', () => {
    expect(travelersOf({ ownerUid: 'me', travelerUids: ['lars'] })).toEqual(['lars'])
    expect(isTravelling({ ownerUid: 'me', travelerUids: ['lars'] }, 'me')).toBe(false)
  })
})

describe('toggleTraveler', () => {
  it('adds and removes', () => {
    expect(toggleTraveler(['me'], 'lars')).toEqual(['me', 'lars'])
    expect(toggleTraveler(['me', 'lars'], 'me')).toEqual(['lars'])
  })

  it('keeps the last traveller', () => {
    expect(toggleTraveler(['me'], 'me')).toEqual(['me'])
  })
})

describe('travelersLabel', () => {
  const members = ['me', 'lars', 'eva']

  it('says everyone when the whole group travels', () => {
    expect(travelersLabel(['eva', 'me', 'lars'], members, 'me', nameOf, labels)).toBe('Alle')
  })

  it('lists names with yourself first', () => {
    expect(travelersLabel(['lars', 'me'], members, 'me', nameOf, labels)).toBe('Dig, Lars')
    expect(travelersLabel(['lars'], members, 'me', nameOf, labels)).toBe('Lars')
  })

  it('does not say everyone on a trip with one person', () => {
    expect(travelersLabel(['me'], ['me'], 'me', nameOf, labels)).toBe('Dig')
  })
})
