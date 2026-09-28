/**
 * Tolker datoer og klokkeslæt, som de står i bekræftelsesmails på dansk og
 * engelsk: "29. september 2026", "tir. 29. sep.", "Sep 29, 2026",
 * "29.09.2026", "2026-09-29", "15:00", "3:00 PM", "kl. 15".
 */

const MONTHS: Record<string, number> = {
  januar: 1,
  january: 1,
  jan: 1,
  februar: 2,
  february: 2,
  feb: 2,
  marts: 3,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  maj: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
}

// Længste navne først, så "september" ikke matches som "sep" + "tember".
const MONTH_PATTERN = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join('|')

const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/
const NUMERIC = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})\b/
const DAY_MONTH = new RegExp(
  `\\b(\\d{1,2})\\.?\\s+(${MONTH_PATTERN})\\.?(?:,?\\s+(\\d{4}))?\\b`,
  'i',
)
const MONTH_DAY = new RegExp(
  `\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?`,
  'i',
)

export type FoundDate = { date: string; index: number; length: number }

function iso(year: number, month: number, day: number): string | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Mangler året (typisk i Airbnb/Booking-tekst), vælges det, der ligger tættest på `reference`. */
function closestYear(month: number, day: number, reference: string): number {
  const referenceYear = Number(reference.slice(0, 4))
  const referenceTime = Date.parse(`${reference}T00:00:00Z`)
  const candidates = [referenceYear - 1, referenceYear, referenceYear + 1]
  return candidates.reduce((best, year) =>
    Math.abs(Date.UTC(year, month - 1, day) - referenceTime) <
    Math.abs(Date.UTC(best, month - 1, day) - referenceTime)
      ? year
      : best,
  )
}

/** Første dato i teksten (og hvor den står, så den kan fjernes før klokkeslæt søges). */
export function findDate(text: string, reference: string): FoundDate | undefined {
  const candidates: FoundDate[] = []
  const add = (match: RegExpMatchArray | null, date: string | undefined) => {
    if (match?.index !== undefined && date) {
      candidates.push({ date, index: match.index, length: match[0].length })
    }
  }

  const isoMatch = text.match(ISO)
  if (isoMatch) add(isoMatch, iso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])))

  const numeric = text.match(NUMERIC)
  if (numeric) {
    const [a, b] = [Number(numeric[1]), Number(numeric[2])]
    const year = numeric[3].length === 2 ? 2000 + Number(numeric[3]) : Number(numeric[3])
    // Dag først (europæisk) — medmindre det kun giver mening som amerikansk måned/dag.
    const [day, month] = b > 12 && a <= 12 ? [b, a] : [a, b]
    add(numeric, iso(year, month, day))
  }

  const dayMonth = text.match(DAY_MONTH)
  if (dayMonth) {
    const month = MONTHS[dayMonth[2].toLowerCase()]
    const day = Number(dayMonth[1])
    const year = dayMonth[3] ? Number(dayMonth[3]) : closestYear(month, day, reference)
    add(dayMonth, iso(year, month, day))
  }

  const monthDay = text.match(MONTH_DAY)
  if (monthDay) {
    const month = MONTHS[monthDay[1].toLowerCase()]
    const day = Number(monthDay[2])
    const year = monthDay[3] ? Number(monthDay[3]) : closestYear(month, day, reference)
    add(monthDay, iso(year, month, day))
  }

  return candidates.sort((x, y) => x.index - y.index)[0]
}

// "15:00" / "3.00 pm" | "3 PM" | "kl. 15"
const TIME =
  /\b(\d{1,2})[:.](\d{2})\s*(am|pm|a\.m\.|p\.m\.)?|\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)|\bkl\.?\s*(\d{1,2})\b/gi

/**
 * Alle klokkeslæt i teksten som HH:mm, i rækkefølge — 24-timers eller AM/PM.
 * Kald efter datoen er fjernet (ellers læses "29.09" som et klokkeslæt).
 */
export function findTimes(text: string): string[] {
  return [...text.matchAll(TIME)].flatMap((match) => {
    const hoursText = match[1] ?? match[4] ?? match[6]
    const minutes = match[2] ? Number(match[2]) : 0
    const suffix = (match[3] ?? match[5])?.toLowerCase().replace(/\./g, '')
    let hours = Number(hoursText)
    if (suffix === 'pm' && hours < 12) hours += 12
    if (suffix === 'am' && hours === 12) hours = 0
    if (hours > 23 || minutes > 59) return []
    return [`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`]
  })
}
