import { updateDayPlace } from '../repository'
import type { Place } from '../../../shared/types/place'

export function useDayPlace() {
  async function setDayPlace(
    tripId: string,
    dayId: string,
    field: 'fromPlace' | 'toPlace',
    place: Place,
  ): Promise<void> {
    await updateDayPlace(tripId, dayId, field, place)
  }

  return { setDayPlace }
}
