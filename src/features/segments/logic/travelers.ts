import type { Segment } from '../types'

/**
 * Hvem der rejser med transporten. Ældre segmenter uden `travelerUids`
 * hører til den, der oprettede dem.
 */
export function travelersOf(segment: Pick<Segment, 'travelerUids' | 'ownerUid'>): string[] {
  return segment.travelerUids && segment.travelerUids.length > 0
    ? segment.travelerUids
    : [segment.ownerUid]
}

export function isTravelling(
  segment: Pick<Segment, 'travelerUids' | 'ownerUid'>,
  uid: string,
): boolean {
  return travelersOf(segment).includes(uid)
}

/** Slår/fjerner én person; den sidste kan ikke fjernes (nogen skal være med). */
export function toggleTraveler(travelers: string[], uid: string): string[] {
  if (!travelers.includes(uid)) return [...travelers, uid]
  return travelers.length > 1 ? travelers.filter((t) => t !== uid) : travelers
}

/**
 * Teksten på et kort: "Alle", når hele rejseselskabet er med — ellers
 * navnene, med én selv ("Dig") først.
 */
export function travelersLabel(
  travelers: string[],
  memberUids: string[],
  selfUid: string,
  nameOf: (uid: string) => string,
  labels: { everyone: string; you: string },
): string {
  const everyone = memberUids.length > 1 && memberUids.every((uid) => travelers.includes(uid))
  if (everyone) return labels.everyone
  const ordered = [...travelers].sort((a, b) => Number(b === selfUid) - Number(a === selfUid))
  return ordered.map((uid) => (uid === selfUid ? labels.you : nameOf(uid))).join(', ')
}
