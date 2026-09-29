import { TextError } from '../../../shared/i18n/message'
import type { GpsFix } from './shouldRecordPoint'

export type ParsedGpx = {
  /** Sporets navn fra <trk><name>, hvis angivet (f.eks. "Morgentur"). */
  name?: string
  /** Punkter med tidspunkt, i filens rækkefølge. */
  fixes: GpsFix[]
  /** Antal punkter uden tidspunkt, der blev sprunget over. */
  skipped: number
}

const TRKPT = /<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/g
const TRACK_NAME = /<trk\b[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>/

function attribute(attrs: string, name: string): number | undefined {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`))
  const value = match ? Number(match[1]) : NaN
  return Number.isFinite(value) ? value : undefined
}

function decodeXmlText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

/**
 * Læser trackpoints fra en GPX-fil (eksport fra Strava, Garmin, Samsung
 * Health m.fl.). Skrevet med regulære udtryk i stedet for DOMParser, så den
 * er en ren funktion, der kan testes uden browser. Punkter uden <time>
 * springes over — tidspunktet er nødvendigt for at placere sporet i rejsen.
 */
export function parseGpx(xml: string): ParsedGpx {
  if (!/<gpx\b/i.test(xml)) {
    throw new TextError('tracking.errorNotGpx')
  }

  const fixes: GpsFix[] = []
  let skipped = 0

  for (const match of xml.matchAll(TRKPT)) {
    const attrs = match[1]
    const body = match[2] ?? ''
    const lat = attribute(attrs, 'lat')
    const lng = attribute(attrs, 'lon')
    const time = body.match(/<time>([^<]+)<\/time>/)?.[1]?.trim()
    const parsedTime = time ? Date.parse(time) : NaN

    if (lat === undefined || lng === undefined || !Number.isFinite(parsedTime)) {
      skipped++
      continue
    }
    fixes.push({ lat, lng, timestamp: new Date(parsedTime).toISOString() })
  }

  const rawName = xml.match(TRACK_NAME)?.[1]
  return { name: rawName ? decodeXmlText(rawName) || undefined : undefined, fixes, skipped }
}
