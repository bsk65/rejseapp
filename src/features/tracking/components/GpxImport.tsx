import { useRef, type ChangeEvent } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { formatDayDate } from '../../../shared/utils/date'
import { useDeleteTrackPoints } from '../hooks/useDeleteTrackPoints'
import { useGpxImport } from '../hooks/useGpxImport'
import { summarizeImports } from '../logic/summarizeImports'
import type { TrackPoint, TrackingContext } from '../types'
import styles from './GpxImport.module.css'

/** Import af GPS-spor fra ur/Strava (GPX-fil) + liste over importerede spor. */
export function GpxImport({
  context,
  points,
  selectedImportId,
  onSelectImport,
}: {
  context: TrackingContext
  points: TrackPoint[]
  selectedImportId: string | null
  onSelectImport: (importId: string) => void
}) {
  const { t, locale } = useT()
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
          ? t('tracking.savingTrack', { saved: progress.saved, total: progress.total })
          : pending
            ? t('tracking.readingFile')
            : t('tracking.importGpx')}
      </Button>
      <p className={styles.hint}>{t('tracking.gpxHint')}</p>

      {error && <p className={styles.error}>{t(error.key, error.params)}</p>}
      {result && (
        <p className={styles.success}>
          {t('tracking.imported', {
            label: result.label,
            n: result.pointCount,
            date: formatDayDate(result.startedAt.slice(0, 10), locale),
          })}
        </p>
      )}

      {imports.length > 0 && (
        <ul className={styles.list}>
          {imports.map((imp) => (
            <li
              key={imp.importId}
              className={styles.item}
              data-selected={imp.importId === selectedImportId}
            >
              <button
                type="button"
                className={styles.selectButton}
                onClick={() => onSelectImport(imp.importId)}
              >
                <span>{imp.label ?? t('trips.importedTrack')}</span>
                <span className={styles.meta}>
                  {formatDayDate(imp.startedAt.slice(0, 10), locale)} ·{' '}
                  {t('tracking.points', { n: imp.pointCount })} ·{' '}
                  {imp.importId === selectedImportId
                    ? t('tracking.shownOnMap')
                    : t('tracking.tapToShow')}
                </span>
              </button>
              {imp.ownerUid === context.userUid && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={t('tracking.deleteTrack', {
                    label: imp.label ?? t('trips.importedTrack'),
                  })}
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
