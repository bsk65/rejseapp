import { findDate, findTimes } from './parseLooseDate'

/** Det, der kunne læses ud af en indsat bekræftelse. Alt er valgfrit — ret altid efter. */
export type ParsedStay = {
  name?: string
  /** Adressen som tekst — slås op som sted bagefter. */
  address?: string
  checkInDate?: string
  checkInTime?: string
  checkOutDate?: string
  checkOutTime?: string
  bookingRef?: string
  hostPhone?: string
  accessCode?: string
  wifi?: string
}

// Overskrifter (dansk og engelsk) som de står i Booking.com-, Airbnb- og
// hotelmails. Værdien står enten efter overskriften eller på linjen under.
const LABELS = {
  checkIn: /^(?:indtjekning|indtjek|check-?\s?in|ankomst|arrival)\b/i,
  checkOut: /^(?:udtjekning|udtjek|check-?\s?out|afrejse|departure)\b/i,
  address: /^(?:adresse|address|beliggenhed|location)\b/i,
  bookingRef:
    /^(?:bookingnummer|booking-?nummer|bekræftelsesnummer|bekræftelseskode|reservationsnummer|reservationskode|booking number|booking reference|booking ref|confirmation number|confirmation code|reservation number|reservation code)\b/i,
  phone: /^(?:telefon(?:nummer)?|tlf\.?|phone(?: number)?|tel\.?)(?=[\s:.]|$)/i,
  accessCode: /^(?:dørkode|door code|nøgleboks|key ?box|lockbox|adgangskode)\b/i,
  wifi: /^(?:wi-?fi|trådløst netværk|wireless)\b/i,
  name: /^(?:ejendom|overnatningssted|indkvartering|property|accommodation|hotel)\s*:/i,
}

const ANY_LABEL = Object.values(LABELS)

function isLabel(line: string): boolean {
  return ANY_LABEL.some((label) => label.test(line))
}

/** Teksten efter overskriften, uden kolon o.l. foran. */
function afterLabel(line: string, label: RegExp): string {
  return line
    .replace(label, '')
    .replace(/^[\s:.\-–]+/, '')
    .trim()
}

/**
 * Værdien for en overskrift: resten af linjen, og — hvis den mangler eller
 * er kort — de næste linjer, indtil en ny overskrift (højst `extraLines`).
 */
function valueFor(lines: string[], label: RegExp, extraLines = 1): string | undefined {
  const index = lines.findIndex((line) => label.test(line))
  if (index === -1) return undefined
  const parts = [afterLabel(lines[index], label)]
  for (let i = index + 1; i <= index + extraLines && i < lines.length; i++) {
    if (isLabel(lines[i])) break
    parts.push(lines[i])
  }
  const value = parts.filter(Boolean).join(' ').trim()
  return value || undefined
}

/**
 * Dato og klokkeslæt fra en ind-/udtjekningslinje. Står der et tidsrum
 * ("15:00 – 00:00" / "00:00 – 11:00"), er indtjek det første klokkeslæt og
 * udtjek det sidste (senest).
 */
function dateAndTime(value: string | undefined, reference: string, pick: 'first' | 'last') {
  if (!value) return {}
  const found = findDate(value, reference)
  // Datoen fjernes, før der ledes efter klokkeslæt — ellers læses "29.09" som 29:09.
  const rest = found
    ? value.slice(0, found.index) + ' ' + value.slice(found.index + found.length)
    : value
  const times = findTimes(rest)
  return { date: found?.date, time: pick === 'first' ? times[0] : times[times.length - 1] }
}

function findName(text: string, lines: string[]): string | undefined {
  const labelled = valueFor(lines, LABELS.name, 0)
  if (labelled) return labelled
  const sentence = text.match(
    /(?:din booking (?:på|hos)|your (?:booking|reservation|stay) at|du skal bo på|you're staying at)\s+(.+?)(?:\s+er bekræftet|\s+is confirmed|[.!\n]|$)/i,
  )
  return sentence?.[1].trim()
}

function findAddress(lines: string[]): string | undefined {
  const index = lines.findIndex((line) => LABELS.address.test(line))
  if (index === -1) return undefined
  const parts = [afterLabel(lines[index], LABELS.address)].filter(Boolean)
  // Adressen fylder ofte to linjer: gade, og så postnummer + by.
  for (let i = index + 1; i < lines.length && parts.length < 2; i++) {
    if (isLabel(lines[i])) break
    if (parts.length === 0 || /^\d{3,6}\s/.test(lines[i]) || /^[A-Z]{1,2}\d/.test(lines[i])) {
      parts.push(lines[i])
    } else break
  }
  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * Læser en indsat bekræftelse (Booking.com, Airbnb, hotel …). Ren heuristik —
 * formaterne skifter, så brugeren retter altid resultatet til.
 * `reference` (YYYY-MM-DD) bruges til at gætte året, hvis det mangler.
 */
export function parseStayConfirmation(text: string, reference: string): ParsedStay {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const checkIn = dateAndTime(valueFor(lines, LABELS.checkIn, 2), reference, 'first')
  const checkOut = dateAndTime(valueFor(lines, LABELS.checkOut, 2), reference, 'last')
  const bookingRef = valueFor(lines, LABELS.bookingRef)?.match(/[A-Z0-9][A-Z0-9.-]{3,}/i)?.[0]
  const hostPhone = valueFor(lines, LABELS.phone)?.match(/\+?\d[\d\s().-]{5,}\d/)?.[0]

  const result: ParsedStay = {
    name: findName(text, lines),
    address: findAddress(lines),
    checkInDate: checkIn.date,
    checkInTime: checkIn.time,
    checkOutDate: checkOut.date,
    checkOutTime: checkOut.time,
    bookingRef,
    hostPhone,
    accessCode: valueFor(lines, LABELS.accessCode, 0),
    wifi: valueFor(lines, LABELS.wifi, 0),
  }
  // Kun felter der faktisk blev fundet — så de ikke overskriver noget med tomt.
  return Object.fromEntries(
    Object.entries(result).filter(([, value]) => value !== undefined),
  ) as ParsedStay
}
