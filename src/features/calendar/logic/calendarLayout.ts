import { addDaysToIsoDate } from '../../../shared/utils/date'
import type { Reservation } from '../../reservations/types'
import { flightDurationMinutes } from '../../segments/logic/flightDuration'
import type { TicketEntry } from '../../segments/logic/tickets'
import { nightCount } from '../../stays/logic/stayDates'
import type { Stay } from '../../stays/types'

const DAY_MINUTES = 24 * 60
/** Transport uden kendt ankomst og reservationer (har kun et starttidspunkt) fylder en time. */
const DEFAULT_MINUTES = 60
/** Så korte ting (en 20-minutters bus) stadig kan læses og trykkes på. */
const MIN_BLOCK_MINUTES = 30

/** Det, et punkt i kalenderen peger på — åbnes i sin formular ved tryk. */
export type CalendarSource =
  { kind: 'segment'; entry: TicketEntry } | { kind: 'reservation'; reservation: Reservation }

/** Et punkt i én dags kolonne. Minutter regnes fra dagens midnat. */
export type CalendarEvent = {
  key: string
  /** YYYY-MM-DD — dagen, stykket vises på. */
  date: string
  source: CalendarSource
  start: number
  end: number
  /** Fortsat fra dagen før (natfly) — vises uden starttidspunkt. */
  continued: boolean
  /** Ved siden af hinanden, når punkter overlapper: kolonne `lane` af `lanes`. */
  lane: number
  lanes: number
}

/** Transport og reservationer uden klokkeslæt — vises øverst i dagens kolonne. */
export type UntimedItem = { key: string; source: CalendarSource }

export type CalendarDay = { timed: CalendarEvent[]; untimed: UntimedItem[] }

/** "2026-10-03T07:40" eller "07:40" → minutter efter midnat. */
function minutesOf(time: string | undefined): number | undefined {
  const match = time?.match(/(\d{2}):(\d{2})/)
  return match ? Number(match[1]) * 60 + Number(match[2]) : undefined
}

function isoDateOf(time: string | undefined): string | undefined {
  return time?.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
}

/** Varighed i minutter: flyvetid med tidszoner, ellers lokal ankomst minus afgang. */
function segmentMinutes(entry: TicketEntry): number {
  const { segment } = entry
  const flight = flightDurationMinutes(segment)
  if (flight !== undefined) return flight
  const departs = segment.departureTime && Date.parse(`${segment.departureTime}:00Z`)
  const arrives = segment.arrivalTime && Date.parse(`${segment.arrivalTime}:00Z`)
  if (departs && arrives && arrives > departs) return Math.round((arrives - departs) / 60_000)
  return DEFAULT_MINUTES
}

type RawEvent = Omit<CalendarEvent, 'lane' | 'lanes'>

/** Et punkt, der går over midnat (natfly), deles i ét stykke pr. dag. */
function splitOverDays(
  key: string,
  source: CalendarSource,
  date: string,
  start: number,
  minutes: number,
): RawEvent[] {
  const pieces: RawEvent[] = []
  let remaining = Math.max(minutes, MIN_BLOCK_MINUTES)
  let dayStart = start
  let day = date
  for (let i = 0; remaining > 0 && i < 3; i++) {
    const end = Math.min(DAY_MINUTES, dayStart + remaining)
    pieces.push({ key: `${key}:${i}`, source, date: day, start: dayStart, end, continued: i > 0 })
    remaining -= end - dayStart
    dayStart = 0
    day = addDaysToIsoDate(day, 1)
  }
  return pieces
}

/** Fordeler overlappende punkter i spor side om side (som i en almindelig kalender). */
function assignLanes(events: RawEvent[]): CalendarEvent[] {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end)
  const result: CalendarEvent[] = []
  let group: CalendarEvent[] = []
  let groupEnd = -1
  let laneEnds: number[] = []

  const closeGroup = () => {
    const lanes = laneEnds.length
    group.forEach((event) => (event.lanes = lanes))
    result.push(...group)
    group = []
    laneEnds = []
  }

  sorted.forEach((event) => {
    if (event.start >= groupEnd) closeGroup()
    let lane = laneEnds.findIndex((end) => end <= event.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = event.end
    group.push({ ...event, lane, lanes: 1 })
    groupEnd = Math.max(groupEnd, event.end)
  })
  closeGroup()
  return result
}

/** Kalenderens indhold pr. dato (YYYY-MM-DD) for rejsens transport og reservationer. */
export function buildCalendarDays(
  entries: TicketEntry[],
  reservations: Reservation[],
): Map<string, CalendarDay> {
  const raw: RawEvent[] = []
  const untimed = new Map<string, UntimedItem[]>()
  const addUntimed = (date: string, item: UntimedItem) =>
    untimed.set(date, [...(untimed.get(date) ?? []), item])

  entries.forEach((entry) => {
    const source: CalendarSource = { kind: 'segment', entry }
    const key = `segment:${entry.segment.id}`
    const start = minutesOf(entry.segment.departureTime)
    const date = isoDateOf(entry.segment.departureTime) ?? entry.dayDate
    if (start === undefined) addUntimed(entry.dayDate, { key, source })
    else raw.push(...splitOverDays(key, source, date, start, segmentMinutes(entry)))
  })

  reservations.forEach((reservation) => {
    const source: CalendarSource = { kind: 'reservation', reservation }
    const key = `reservation:${reservation.id}`
    const start = minutesOf(reservation.time)
    if (start === undefined) addUntimed(reservation.date, { key, source })
    else raw.push(...splitOverDays(key, source, reservation.date, start, DEFAULT_MINUTES))
  })

  const days = new Map<string, CalendarDay>()
  const dates = new Set([...raw.map((event) => event.date), ...untimed.keys()])
  dates.forEach((date) =>
    days.set(date, {
      timed: assignLanes(raw.filter((event) => event.date === date)),
      untimed: untimed.get(date) ?? [],
    }),
  )
  return days
}

/**
 * Timerne, kalenderen viser: som udgangspunkt 07–22, men udvidet, så alt på
 * rejsen kan ses (et fly kl. 05.30 giver 05–22). Samme for hele rejsen, så
 * tiderne ikke hopper, når man bladrer.
 */
export function visibleHours(days: Map<string, CalendarDay>): { first: number; last: number } {
  const timed = [...days.values()].flatMap((day) => day.timed)
  const first = Math.min(7, ...timed.map((event) => Math.floor(event.start / 60)))
  const last = Math.max(22, ...timed.map((event) => Math.ceil(event.end / 60)))
  return { first: Math.max(0, first), last: Math.min(24, last) }
}

/** En overnatning som en bjælke hen over de viste dage. Kolonner tælles fra 0. */
export type StayBar = {
  stay: Stay
  startColumn: number
  /** Sidste kolonne (medregnet) — udtjekningsdagen, hvis den er synlig. */
  endColumn: number
  /** Fortsætter før/efter de viste dage. */
  startsBefore: boolean
  endsAfter: boolean
  /** Række, så overnatninger der mødes på en skiftedag ikke dækker hinanden. */
  row: number
}

/** Overnatningsbjælker for de viste datoer (fortløbende dage). */
export function stayBars(stays: Stay[], dates: string[]): StayBar[] {
  if (dates.length === 0) return []
  const first = dates[0]
  const last = dates[dates.length - 1]
  const bars: StayBar[] = []
  const rowEnds: string[] = []

  ;[...stays]
    .filter((stay) => stay.checkInDate <= last && stay.checkOutDate >= first)
    .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
    .forEach((stay) => {
      const startColumn = Math.max(0, nightCount(first, stay.checkInDate))
      const endColumn = Math.min(dates.length - 1, nightCount(first, stay.checkOutDate))
      // Samme række kan genbruges, når den forrige overnatning er tjekket ud dagen før.
      let row = rowEnds.findIndex((end) => end < stay.checkInDate)
      if (row === -1) row = rowEnds.length
      rowEnds[row] = stay.checkOutDate
      bars.push({
        stay,
        startColumn,
        endColumn,
        startsBefore: stay.checkInDate < first,
        endsAfter: stay.checkOutDate > last,
        row,
      })
    })
  return bars
}
