import type { Place } from '../../../shared/types/place'
import { shouldFollowPreviousTo } from '../logic/followPreviousDay'
import { updateDayPlace, updateToPlaceAndNextFrom } from '../repository'
import type { Day } from '../types'

export function useDayPlace() {
  async function setFromPlace(tripId: string, day: Day, place: Place): Promise<void> {
    await updateDayPlace(tripId, day.id, 'fromPlace', place)
  }

  /** Sætter dagens "Til" — og næste dags "Fra", hvis den skal følge med. */
  async function setToPlace(
    tripId: string,
    day: Day,
    nextDay: Day | undefined,
    place: Place,
  ): Promise<void> {
    if (nextDay && shouldFollowPreviousTo(nextDay, day.toPlace)) {
      await updateToPlaceAndNextFrom(tripId, day.id, nextDay.id, place)
    } else {
      await updateDayPlace(tripId, day.id, 'toPlace', place)
    }
  }

  return { setFromPlace, setToPlace }
}
