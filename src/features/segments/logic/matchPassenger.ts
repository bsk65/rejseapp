/** Små bogstaver uden accenter, delt i ord ("Bjarne Stubkjær" → ["bjarne", "stubkjaer"]). */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean)
}

/** Titler, som flyselskaberne sætter efter fornavnet i stregkoden. */
const TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'mstr', 'dr', 'chd', 'inf'])

/**
 * Finder rejsefællen, et boardingkort tilhører, ud fra navnet i stregkoden
 * ("KLAUSEN/BJARNE MR"): både efternavnet og første fornavn skal indgå i
 * personens navn. Stregkoden staver æ/ø/å som AE/OE/AA — derfor samme
 * omskrivning på begge sider. Returnerer undefined, hvis ingen (eller flere) passer.
 */
export function matchPassenger(
  passengerName: string,
  people: { uid: string; name: string }[],
): string | undefined {
  const [surnamePart = '', givenPart = ''] = passengerName.split('/')
  const surname = words(surnamePart)
  const firstName = words(givenPart).filter((w) => !TITLES.has(w))[0]
  if (surname.length === 0 || !firstName) return undefined

  const matches = people.filter(({ name }) => {
    const nameWords = words(name)
    return nameWords.includes(firstName) && surname.every((w) => nameWords.includes(w))
  })
  return matches.length === 1 ? matches[0].uid : undefined
}
