/**
 * IATA-koder for de flyselskaber, man typisk flyver med fra Danmark — så
 * "Air France" + "1762" kan slås op som AF1762. Ikke udtømmende; står
 * selskabet ikke her, må brugeren selv skrive koden foran nummeret.
 */
const AIRLINES: [code: string, names: string[]][] = [
  ['SK', ['SAS', 'Scandinavian Airlines']],
  ['DY', ['Norwegian', 'Norwegian Air Shuttle']],
  ['DX', ['DAT', 'Danish Air Transport']],
  ['DK', ['Sunclass', 'Sunclass Airlines']],
  ['FR', ['Ryanair']],
  ['U2', ['easyJet']],
  ['W6', ['Wizz Air', 'Wizzair']],
  ['AF', ['Air France']],
  ['KL', ['KLM', 'KLM Royal Dutch Airlines']],
  ['LH', ['Lufthansa']],
  ['LX', ['Swiss', 'Swiss International Air Lines']],
  ['OS', ['Austrian', 'Austrian Airlines']],
  ['SN', ['Brussels Airlines']],
  ['EW', ['Eurowings']],
  ['BA', ['British Airways']],
  ['EI', ['Aer Lingus']],
  ['LS', ['Jet2']],
  ['AY', ['Finnair']],
  ['FI', ['Icelandair']],
  ['WF', ['Widerøe', 'Wideroe']],
  ['BT', ['airBaltic']],
  ['LO', ['LOT', 'LOT Polish Airlines']],
  ['IB', ['Iberia']],
  ['VY', ['Vueling']],
  ['UX', ['Air Europa']],
  ['TP', ['TAP', 'TAP Air Portugal']],
  ['AZ', ['ITA Airways', 'ITA']],
  ['A3', ['Aegean', 'Aegean Airlines']],
  ['HV', ['Transavia']],
  ['DE', ['Condor']],
  ['TK', ['Turkish Airlines', 'Turkish']],
  ['PC', ['Pegasus', 'Pegasus Airlines']],
  ['EK', ['Emirates']],
  ['QR', ['Qatar Airways', 'Qatar']],
  ['EY', ['Etihad', 'Etihad Airways']],
  ['DL', ['Delta', 'Delta Air Lines']],
  ['UA', ['United', 'United Airlines']],
  ['AA', ['American Airlines', 'American']],
  ['AC', ['Air Canada']],
  ['SQ', ['Singapore Airlines']],
  ['TG', ['Thai Airways', 'Thai']],
]

/** Kun bogstaver/tal, små bogstaver — så "Air France", "airfrance" og "AIR FRANCE " er ens. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9ø]/g, '')
}

/** IATA-koden for et selskab ("Air France" → "AF"), eller koden selv hvis den er skrevet ("af"). */
export function airlineCode(carrier: string | undefined): string | undefined {
  if (!carrier?.trim()) return undefined
  const wanted = normalize(carrier)
  const byName = AIRLINES.find(([, names]) => names.some((name) => normalize(name) === wanted))
  if (byName) return byName[0]
  const byCode = AIRLINES.find(([code]) => normalize(code) === wanted)
  return byCode?.[0]
}

/**
 * Sætter selskabets kode foran et flynummer, der kun består af tal
 * ("1762" + "Air France" → "AF1762"). Har nummeret allerede en kode, eller
 * kendes selskabet ikke, returneres nummeret uændret.
 */
export function withAirlineCode(
  number: string | undefined,
  carrier: string | undefined,
): string | undefined {
  const trimmed = number?.trim()
  if (!trimmed || !/^\d{1,4}[A-Z]?$/i.test(trimmed)) return trimmed || undefined
  const code = airlineCode(carrier)
  return code ? `${code}${trimmed.toUpperCase()}` : trimmed
}
