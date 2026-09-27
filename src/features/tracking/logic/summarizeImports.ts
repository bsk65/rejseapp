import type { TrackPoint } from '../types'

export type ImportSummary = {
  importId: string
  label: string
  ownerUid: string
  pointCount: number
  /** ISO-tidspunkt for sporets første punkt. */
  startedAt: string
  pointIds: string[]
}

/** Samler importerede punkter pr. import, ældste spor først. */
export function summarizeImports(points: TrackPoint[]): ImportSummary[] {
  const byImport = new Map<string, ImportSummary>()
  for (const point of points) {
    if (!point.importId) continue
    const existing = byImport.get(point.importId)
    if (existing) {
      existing.pointCount++
      existing.pointIds.push(point.id)
      if (point.timestamp < existing.startedAt) existing.startedAt = point.timestamp
    } else {
      byImport.set(point.importId, {
        importId: point.importId,
        label: point.label ?? 'Importeret spor',
        ownerUid: point.ownerUid,
        pointCount: 1,
        startedAt: point.timestamp,
        pointIds: [point.id],
      })
    }
  }
  return Array.from(byImport.values()).sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1))
}
