import { useRef, type ChangeEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { formatDayDate } from '../../../shared/utils/date'
import { useDeleteTrackPoints } from '../hooks/useDeleteTrackPoints'
import { useGpxImport } from '../hooks/useGpxImport'
import { summarizeImports } from '../logic/summarizeImports'
import type { TrackPoint, TrackingContext } from '../types'
import styles from './GpxImport.module.css'

/** Import af GPS-spor fra ur/Strava (GPX-fil) + liste over importerede spor. */
export function GpxImport({ context, points }: { context: TrackingContext; points: TrackPoint[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { importFile, pending, progress, error, result } = useGpxImport(context)
  const { remove, pendingIds } = useDeleteTrackPoints()
  const imports = summarizeImports(points)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) await importFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,application/gpx+xml"
        className={styles.hiddenInput}
        onChange={(e) => void handleChange(e)}
        disabled={pending}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {progress
          ? `Gemmer spor… ${progress.saved} af ${progress.total}`
          : pending
            ? 'Læser fil…'
            : 'Importér GPS-spor (GPX)'}
      </Button>
      <p className={styles.hint}>
        Fra ur eller Strava: åbn turen på strava.com → ⋯ → “Eksportér GPX”.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {result && (
        <p className={styles.success}>
          “{result.label}” er importeret ({result.pointCount} punkter,{' '}
          {formatDayDate(result.startedAt.slice(0, 10))}).
        </p>
      )}

      {imports.length > 0 && (
        <ul className={styles.list}>
          {imports.map((imp) => (
            <li key={imp.importId} className={styles.item}>
              <div className={styles.text}>
                <span>{imp.label}</span>
                <span className={styles.meta}>
                  {formatDayDate(imp.startedAt.slice(0, 10))} · {imp.pointCount} punkter
                </span>
              </div>
              {imp.ownerUid === context.userUid && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`Slet sporet ${imp.label}`}
                  disabled={pendingIds === imp.importId}
                  onClick={() => void remove(context.tripId, imp.importId, imp.pointIds)}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
