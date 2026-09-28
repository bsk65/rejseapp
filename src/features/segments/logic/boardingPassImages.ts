import type { BoardingPassImage } from '../types'

function samePassenger(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase()
}

/**
 * Tilføjer et boardingkort til flyets liste. Har samme passager allerede et
 * (scannet igen), erstattes det — rejsefællers kort bevares.
 */
export function withBoardingPass(
  existing: BoardingPassImage[] | undefined,
  added: BoardingPassImage,
): BoardingPassImage[] {
  return [
    ...(existing ?? []).filter((pass) => !samePassenger(pass.passengerName, added.passengerName)),
    added,
  ]
}

/** Stregkodens "KLAUSEN/BJARNE MR" → "Bjarne Klausen". */
export function formatPassengerName(raw: string): string {
  const [last = '', first = ''] = raw.trim().split('/')
  const firstName = first.replace(/\s+(MR|MRS|MS|MISS|MSTR|DR)$/i, '').trim()
  const capitalize = (value: string) =>
    value
      .toLowerCase()
      .split(/([\s-])/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  return [firstName, last.trim()].filter(Boolean).map(capitalize).join(' ') || raw.trim()
}
