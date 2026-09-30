import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import type { Day } from '../../days/types'
import { planDayRemoval } from '../logic/removeEndDay'
import { removeTripDay } from '../repository'
import type { Trip } from '../types'

/** Fjerner rejsens første eller sidste dag. Vises kun for rejsens ejer. */
export function useRemoveTripDay(trip: Trip | null, days: Day[], userUid: string | undefined) {
  const [error, setError] = useState<TextKey | null>(null)

  async function removeDay(day: Day): Promise<boolean> {
    if (!trip || !userUid) return false
    const plan = planDayRemoval(trip.startDate, trip.days, days, day.id)
    if (!plan) return false
    setError(null)
    try {
      await removeTripDay(trip.id, userUid, day.id, plan)
      return true
    } catch {
      setError('days.errorDelete')
      return false
    }
  }

  return { removeDay, error }
}
