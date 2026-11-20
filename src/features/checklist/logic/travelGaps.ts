import type { Place } from '../../../shared/types/place'
import { distanceMeters } from '../../../shared/utils/geo'
import type { Day } from '../../days/types'
import type { PersonGap, TravelGapReason } from '../types'
import { personLegsOnDay, nightInTransit, stayForNight, type GapInput } from './gapInput'

/**
 * Steder tættere på hinanden end dette regnes for samme sted. Længere væk (f.eks.
 * lufthavn → hotel, eller mellem to overnatninger) mangler der transport: taxa, båd …
 */
export const SAME_PLACE_KM = 2

function farApart(a: Place, b: Place): boolean {
  return distanceMeters(a, b) > SAME_PLACE_KM * 1000
}

/**
 * Følger personen gennem rejsen og finder steder, hvor man ikke kommer videre:
 * hjemmefra (dag 1's Fra) → hver transport (Fra/Til) → nattens overnatning (eller
 * dagens Til, hvis der ingen overnatning er) → hjem (sidste dags Til, ellers
 * dag 1's Fra). Er næste sted langt fra, hvor man er, mangler der transport.
 * Kendes et sted ikke (transport uden Til), tjekkes næste skridt ikke.
 */
export function travelGaps(input: GapInput, uid: string): PersonGap[] {
  const { days, entries, stays } = input
  if (days.length === 0) return []
  const home = days[0].fromPlace
  const end = days[days.length - 1].toPlace ?? home

  const gaps: PersonGap[] = []
  let here: Place | undefined = home
  // Er man kommet afsted hjemmefra endnu? Et hul inden da er udrejsen.
  let departed = false

  function arriveAt(day: Day, place: Place | undefined, last = false) {
    if (!place) return
    if (here && farApart(here, place)) {
      const reason: TravelGapReason = last ? 'hjemrejse' : departed ? 'mellem' : 'udrejse'
      const key = `rejse:${day.id}:${here.placeId}>${place.placeId}`
      if (!gaps.some((gap) => gap.key === key)) {
        gaps.push({
          kind: 'rejse',
          key,
          dayId: day.id,
          dayNumber: day.dayNumber,
          date: day.date,
          reason,
          from: here,
          to: place,
        })
      }
      departed = true
    }
    here = place
  }

  days.forEach((day, i) => {
    personLegsOnDay(entries, day.id, uid).forEach(({ segment }) => {
      arriveAt(day, segment.departurePlace)
      departed = true
      here = segment.arrivalPlace
    })

    if (i === days.length - 1) {
      arriveAt(day, end, true)
      return
    }
    const stay = stayForNight(stays, day.date, uid)
    if (stay) arriveAt(day, stay.place)
    else if (!nightInTransit(entries, day.date, uid)) arriveAt(day, day.toPlace)
  })

  return gaps
}
