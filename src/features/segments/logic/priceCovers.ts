import { clockTime } from '../../../shared/utils/date'
import type { TicketEntry } from './tickets'

/** Datoen et segment afgår (afgangsdatoen, ellers dagens dato). */
export function departureDate(entry: TicketEntry): string {
  return entry.segment.departureTime?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? entry.dayDate
}

/**
 * De andre rejser på turen, som en pris kan dække — i tidsorden, uden gåture
 * og uden segmentet selv.
 */
export function coverCandidates(entries: TicketEntry[], segmentId: string): TicketEntry[] {
  const sortKey = (entry: TicketEntry) =>
    `${departureDate(entry)} ${clockTime(entry.segment.departureTime) ?? '99:99'}`
  return entries
    .filter((entry) => entry.segment.id !== segmentId && entry.segment.mode !== 'gang')
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
}

/** Slår et segment til/fra i listen over dækkede segmenter. */
export function toggleCovered(covered: string[], segmentId: string): string[] {
  return covered.includes(segmentId)
    ? covered.filter((id) => id !== segmentId)
    : [...covered, segmentId]
}
