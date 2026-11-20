import type { Gap } from '../types'

/**
 * Nøglen, et hul markeres "Det er OK" med på sin dag: slagsen for overnatning og
 * aktivitet (ét hul pr. dag), men den bestemte tur for rejser — en dag kan have
 * flere manglende ture, og OK til én må ikke skjule de andre.
 */
export function okKeyOf(gap: Gap): string | undefined {
  if (gap.kind === 'ubekraeftet') return undefined
  if (gap.kind === 'rejse') return `rejse:${gap.from?.key ?? '?'}>${gap.to?.key ?? '?'}`
  return gap.kind
}

/** Dagens OK-markeringer med hullet slået til/fra. Et gammelt rent "rejse" fjernes. */
export function toggleOkKey(current: string[], key: string, ok: boolean): string[] {
  const kept = current.filter((k) => k !== key && k !== 'rejse')
  return ok ? [...kept, key] : kept
}
