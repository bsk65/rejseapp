/**
 * Læser teksten fra stregkoden på et boardingkort (IATA Resolution 792,
 * "Bar Coded Boarding Pass", format "M"). Stregkoden er ren tekst med felter
 * på faste positioner — den samme på papir, i mails og i flyselskabernes apps.
 *
 * Layout (0-indekseret):
 *   0      Formatkode "M"
 *   1      Antal flystrækninger (1-4)
 *   2-21   Passagernavn "EFTERNAVN/FORNAVN"
 *   22     E-billet-markør
 * Pr. strækning (første starter ved 23), 37 tegn:
 *   +0  7  Bookingnummer (PNR)
 *   +7  3  Fra-lufthavn (IATA)
 *   +10 3  Til-lufthavn (IATA)
 *   +13 3  Flyselskab (IATA)
 *   +16 5  Flynummer
 *   +21 3  Dato som dag-i-året (juliansk)
 *   +24 1  Kabineklasse
 *   +25 4  Sæde
 *   +29 5  Check-in-nummer
 *   +34 1  Passagerstatus
 *   +35 2  Længde (hex) af det efterfølgende variable felt, der springes over
 */

export type BoardingPassLeg = {
  bookingRef: string
  fromAirport: string
  toAirport: string
  /** IATA-kode, f.eks. "SK". */
  carrier: string
  /** Uden foranstillede nuller, f.eks. "1415" eller "1415A". */
  flightNumber: string
  /** Dag i året (1-366) — året står ikke i stregkoden. */
  dayOfYear: number
  /** Sæde uden foranstillede nuller, f.eks. "14C". Tom hvis ikke tildelt. */
  seat?: string
}

export type BoardingPass = {
  passengerName: string
  legs: BoardingPassLeg[]
}

const FIRST_LEG_START = 23
const LEG_MANDATORY_LENGTH = 37

function field(text: string, start: number, length: number): string {
  return text.slice(start, start + length).trim()
}

function stripLeadingZeros(value: string): string {
  return value.replace(/^0+(?=.)/, '')
}

export function parseBoardingPass(raw: string): BoardingPass {
  const text = raw.replace(/\r?\n/g, '')
  if (text[0] !== 'M' || text.length < FIRST_LEG_START + LEG_MANDATORY_LENGTH) {
    throw new Error('Stregkoden ligner ikke et boardingkort.')
  }

  const legCount = Number(text[1])
  if (!Number.isInteger(legCount) || legCount < 1 || legCount > 4) {
    throw new Error('Stregkoden ligner ikke et boardingkort.')
  }

  const legs: BoardingPassLeg[] = []
  let position = FIRST_LEG_START
  for (let i = 0; i < legCount && position + LEG_MANDATORY_LENGTH <= text.length; i++) {
    const seat = stripLeadingZeros(field(text, position + 25, 4))
    const dayOfYear = Number(field(text, position + 21, 3))
    legs.push({
      bookingRef: field(text, position, 7),
      fromAirport: field(text, position + 7, 3),
      toAirport: field(text, position + 10, 3),
      carrier: field(text, position + 13, 3),
      flightNumber: stripLeadingZeros(field(text, position + 16, 5)),
      dayOfYear,
      seat: seat && !/^0*$/.test(seat) ? seat : undefined,
    })
    const variableLength = parseInt(field(text, position + 35, 2) || '0', 16)
    position += LEG_MANDATORY_LENGTH + (Number.isFinite(variableLength) ? variableLength : 0)
  }

  if (legs.length === 0 || legs.some((leg) => !/^[A-Z]{3}$/.test(leg.fromAirport))) {
    throw new Error('Stregkoden ligner ikke et boardingkort.')
  }

  return { passengerName: field(text, 2, 20), legs }
}

/**
 * Omsætter dag-i-året til en dato. Året står ikke i stregkoden, så vi vælger
 * det år, der giver den dato, som ligger tættest på `reference` (typisk
 * rejsens startdato).
 */
export function dayOfYearToIsoDate(dayOfYear: number, reference: Date): string {
  const referenceYear = reference.getUTCFullYear()
  let best = ''
  let bestDistance = Infinity
  for (const year of [referenceYear - 1, referenceYear, referenceYear + 1]) {
    const date = new Date(Date.UTC(year, 0, dayOfYear))
    const distance = Math.abs(date.getTime() - reference.getTime())
    if (distance < bestDistance) {
      bestDistance = distance
      best = date.toISOString().slice(0, 10)
    }
  }
  return best
}
