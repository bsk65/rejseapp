import type { Place } from '../../../shared/types/place'
import { distanceMeters } from '../../../shared/utils/geo'
import type { Day } from '../../days/types'
import type { Stay } from '../../stays/types'
import type { GapPlace, PersonGap, TravelGapReason } from '../types'
import { personLegsOnDay, nightInTransit, stayForNight, type GapInput } from './gapInput'

/**
 * Steder tættere på hinanden end dette regnes for samme sted. Længere væk (f.eks.
 * lufthavn → hotel, eller mellem to overnatninger) mangler der transport: taxa, båd …
 */
export const SAME_PLACE_KM = 2

function spotOf(place: Place | undefined): GapPlace | undefined {
  return place && { key: place.placeId, name: place.name, place }
}

/** En overnatning som sted — med sit eget navn; uden adresse kendes kun navnet. */
function stayAsSpot(stay: Stay): GapPlace {
  return stay.place
    ? { key: stay.place.placeId, name: stay.name, place: stay.place }
    : { key: `stay:${stay.id}`, name: stay.name }
}

/**
 * Er der så langt mellem to steder, at der skal transport til? Samme sted er
 * aldrig langt; en overnatning uden adresse er langt fra alt andet.
 */
function farApart(a: GapPlace, b: GapPlace): boolean {
  if (a.key === b.key) return false
  if (!a.place || !b.place) return true
  return distanceMeters(a.place, b.place) > SAME_PLACE_KM * 1000
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
  const home = spotOf(days[0].fromPlace)
  const end = spotOf(days[days.length - 1].toPlace) ?? home

  const gaps: PersonGap[] = []
  let here: GapPlace | undefined = home
  // Er man kommet afsted hjemmefra endnu? Et hul inden da er udrejsen.
  let departed = false

  function arriveAt(day: Day, spot: GapPlace | undefined, last = false) {
    if (!spot) return
    if (here && farApart(here, spot)) {
      const reason: TravelGapReason = last ? 'hjemrejse' : departed ? 'mellem' : 'udrejse'
      const key = `rejse:${day.id}:${here.key}>${spot.key}`
      if (!gaps.some((gap) => gap.key === key)) {
        gaps.push({
          kind: 'rejse',
          key,
          dayId: day.id,
          dayNumber: day.dayNumber,
          date: day.date,
          reason,
          from: here,
          to: spot,
        })
      }
      departed = true
    }
    here = spot
  }

  days.forEach((day, i) => {
    personLegsOnDay(entries, day.id, uid).forEach(({ segment }) => {
      arriveAt(day, spotOf(segment.departurePlace))
      departed = true
      here = spotOf(segment.arrivalPlace)
    })

    if (i === days.length - 1) {
      arriveAt(day, end, true)
      return
    }
    // Undervejs om natten (natfly, kort skift) er man i transporten — også hvis der
    // står en "overnatning" for natten (f.eks. "Fly fra Indonesien til DK").
    if (nightInTransit(entries, day.date, uid)) return
    const stay = stayForNight(stays, day.date, uid)
    arriveAt(day, stay ? stayAsSpot(stay) : spotOf(day.toPlace))
  })

  return gaps
}
