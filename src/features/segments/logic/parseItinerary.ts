export type ParsedFlightDraft = {
  carrier?: string
  number?: string
  departureAirport?: string
  arrivalAirport?: string
  departureTime?: string
  arrivalTime?: string
  bookingRef?: string
}

// Ikke udtømmende — heuristik. Brugeren godkender/retter altid forslaget.
const KNOWN_CARRIERS = [
  'SAS',
  'Norwegian',
  'Ryanair',
  'KLM',
  'Lufthansa',
  'Finnair',
  'Widerøe',
  'easyJet',
  'British Airways',
  'Air France',
  'Turkish Airlines',
  'Icelandair',
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractCarrier(text: string): string | undefined {
  return KNOWN_CARRIERS.find((carrier) =>
    new RegExp(`\\b${escapeRegExp(carrier)}\\b`, 'i').test(text),
  )
}

export function extractFlightNumber(text: string): string | undefined {
  const match = text.match(/\b([A-Z]{2})\s?(\d{2,4})\b/)
  return match ? `${match[1]}${match[2]}` : undefined
}

export function extractAirportPair(text: string): { from?: string; to?: string } {
  const match = text.match(/\b([A-Z]{3})\s*(?:-|–|—|→|til|Til|to|To)\s*([A-Z]{3})\b/)
  if (!match) return {}
  return { from: match[1], to: match[2] }
}

function normalizeNumericDate(raw: string): string | undefined {
  const parts = raw.split(/[./-]/)
  if (parts.length !== 3) return undefined
  const [day, month, rawYear] = parts
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear
  const dayNum = day.padStart(2, '0')
  const monthNum = month.padStart(2, '0')
  if (Number(dayNum) > 31 || Number(monthNum) > 12) return undefined
  return `${year}-${monthNum}-${dayNum}`
}

export function extractDates(text: string): string[] {
  const isoLike = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []
  const numeric = text.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g) ?? []
  const normalizedNumeric = numeric.map(normalizeNumericDate).filter((d): d is string => Boolean(d))
  return [...isoLike, ...normalizedNumeric]
}

export function extractTimes(text: string): string[] {
  return text.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/g) ?? []
}

export function extractBookingRef(text: string): string | undefined {
  const match = text.match(
    /(?:booking(?:s)?(?:-|\s)?(?:ref(?:erence)?|nummer|kode)|bekræftelsesnummer|pnr)[:\s]+([A-Z0-9]{5,8})\b/i,
  )
  return match ? match[1].toUpperCase() : undefined
}

function combineDateAndTime(
  date: string | undefined,
  time: string | undefined,
): string | undefined {
  if (date && time) return `${date}T${time}`
  return date ?? time
}

export function parseFlightItinerary(text: string): ParsedFlightDraft {
  const dates = extractDates(text)
  const times = extractTimes(text)
  const { from, to } = extractAirportPair(text)

  return {
    carrier: extractCarrier(text),
    number: extractFlightNumber(text),
    departureAirport: from,
    arrivalAirport: to,
    departureTime: combineDateAndTime(dates[0], times[0]),
    arrivalTime: combineDateAndTime(dates[1] ?? dates[0], times[1]),
    bookingRef: extractBookingRef(text),
  }
}
