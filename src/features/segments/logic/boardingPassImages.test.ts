import { describe, expect, it } from 'vitest'
import { formatPassengerName, withBoardingPass } from './boardingPassImages'

const pass = (storagePath: string, passengerName: string) => ({
  storagePath,
  passengerName,
  ownerUid: 'a',
})

describe('withBoardingPass', () => {
  it('adds the first boarding pass', () => {
    expect(withBoardingPass(undefined, pass('p1', 'KLAUSEN/BJARNE'))).toEqual([
      pass('p1', 'KLAUSEN/BJARNE'),
    ])
  })

  it("keeps a travel companion's pass on the same flight", () => {
    const list = withBoardingPass([pass('p1', 'KLAUSEN/BJARNE')], pass('p2', 'HANSEN/ANNE'))
    expect(list.map((p) => p.storagePath)).toEqual(['p1', 'p2'])
  })

  it('replaces the same passenger when scanned again', () => {
    const list = withBoardingPass(
      [pass('p1', 'KLAUSEN/BJARNE MR ')],
      pass('p3', 'klausen/bjarne mr'),
    )
    expect(list.map((p) => p.storagePath)).toEqual(['p3'])
  })
})

describe('formatPassengerName', () => {
  it('turns the barcode name into a readable name', () => {
    expect(formatPassengerName('KLAUSEN/BJARNE MR')).toBe('Bjarne Klausen')
    expect(formatPassengerName('JENSEN-LUND/ANNE MARIE')).toBe('Anne Marie Jensen-Lund')
  })

  it('keeps a name without a slash', () => {
    expect(formatPassengerName('BJARNE')).toBe('Bjarne')
  })
})
