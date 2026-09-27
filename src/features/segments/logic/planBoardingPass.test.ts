import { describe, expect, it } from 'vitest'
import type { Day } from '../../days/types'
import type { Segment } from '../types'
import type { BoardingPass } from './parseBoardingPass'
import { planBoardingPass } from './planBoardingPass'
import type { TicketEntry } from './tickets'

function day(dayNumber: number, date: string): Day {
  return { id: `d${dayNumber}`, dayNumber, date, ownerUid: 'u', memberUids: ['u'] }
}

const DAYS = [day(1, '2026-10-03'), day(2, '2026-10-04')]

const PASS: BoardingPass = {
  passengerName: 'KLAUSEN/BJARNE',
  legs: [
    {
      bookingRef: 'X7K2PQ',
      fromAirport: 'CPH',
      toAirport: 'FCO',
      carrier: 'SK',
      flightNumber: '1415',
      dayOfYear: 276, // 3. okt.
      seat: '14C',
    },
  ],
}

function flightEntry(id: string, number: string, dayId = 'd1'): TicketEntry {
  const segment: Segment = {
    id,
    mode: 'fly',
    status: 'planlagt',
    number,
    ownerUid: 'u',
    memberUids: ['u'],
  }
  return { segment, dayId, dayNumber: 1, dayDate: '2026-10-03' }
}

const REFERENCE = new Date('2026-10-03')

describe('planBoardingPass', () => {
  it('places a new flight on the day matching its date', () => {
    expect(planBoardingPass(PASS, DAYS, [], REFERENCE)).toEqual([
      {
        leg: PASS.legs[0],
        flightNumber: 'SK1415',
        date: '2026-10-03',
        dayId: 'd1',
        existingSegmentId: undefined,
      },
    ])
  })

  it('updates an existing flight with the same number, even if written differently', () => {
    const [plan] = planBoardingPass(PASS, DAYS, [flightEntry('s1', 'SK 1415')], REFERENCE)
    expect(plan.existingSegmentId).toBe('s1')
  })

  it('does not match a different flight or another day', () => {
    const [plan] = planBoardingPass(
      PASS,
      DAYS,
      [flightEntry('s1', 'SK 999'), flightEntry('s2', 'SK1415', 'd2')],
      REFERENCE,
    )
    expect(plan.existingSegmentId).toBeUndefined()
  })

  it('leaves the day empty when the flight is outside the trip', () => {
    const [plan] = planBoardingPass(PASS, [day(1, '2026-11-01')], [], REFERENCE)
    expect(plan.dayId).toBeUndefined()
  })
})
