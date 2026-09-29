import { useState } from 'react'
import { errorMessage, TextError, type Message } from '../../../shared/i18n/message'
import { computeViewerUids } from '../../../shared/utils/computeViewerUids'
import { parseGpx } from '../logic/parseGpx'
import { thinTrack } from '../logic/thinTrack'
import { addTrackPoints } from '../repository'
import type { TrackingContext } from '../types'

export type GpxImportResult = {
  label: string
  pointCount: number
  /** Sporets første tidspunkt (ISO). */
  startedAt: string
}

/** Læser en GPX-fil, tynder sporet ud og gemmer det som track-punkter. */
export function useGpxImport({
  tripId,
  userUid,
  tripOwnerUid,
  memberUids,
  shareTrack,
}: TrackingContext) {
  const [pending, setPending] = useState(false)
  const [progress, setProgress] = useState<{ saved: number; total: number } | null>(null)
  const [error, setError] = useState<Message | null>(null)
  const [result, setResult] = useState<GpxImportResult | null>(null)

  async function importFile(file: File): Promise<void> {
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const parsed = parseGpx(await file.text())
      if (parsed.fixes.length === 0) {
        throw new TextError(parsed.skipped > 0 ? 'tracking.errorNoTimes' : 'tracking.errorNoTrack')
      }

      const fixes = [...parsed.fixes].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
      const thinned = thinTrack(fixes)
      const label = parsed.name ?? file.name.replace(/\.gpx$/i, '')
      const importId = crypto.randomUUID()
      const trackViewerUids = computeViewerUids(shareTrack, memberUids, tripOwnerUid, userUid)

      setProgress({ saved: 0, total: thinned.length })
      await addTrackPoints(
        tripId,
        thinned.map((fix) => ({
          lat: fix.lat,
          lng: fix.lng,
          timestamp: fix.timestamp,
          source: 'import' as const,
          label,
          importId,
          ownerUid: userUid,
          trackViewerUids,
        })),
        (saved) => setProgress({ saved, total: thinned.length }),
      )
      setResult({ label, pointCount: thinned.length, startedAt: thinned[0].timestamp })
    } catch (err) {
      setError(errorMessage(err, 'tracking.errorImport'))
    } finally {
      setPending(false)
      setProgress(null)
    }
  }

  return { importFile, pending, progress, error, result }
}
