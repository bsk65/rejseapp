import { useDeleteTrackPoint } from '../hooks/useDeleteTrackPoint'
import type { TrackPoint } from '../types'
import styles from './CheckInList.module.css'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function describePlace(point: TrackPoint): string {
  return point.label ?? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
}

export function CheckInList({
  tripId,
  userUid,
  checkIns,
}: {
  tripId: string
  userUid: string
  checkIns: TrackPoint[]
}) {
  const { remove } = useDeleteTrackPoint()

  if (checkIns.length === 0) {
    return null
  }

  return (
    <ul className={styles.list}>
      {[...checkIns].reverse().map((point) => (
        <li key={point.id} className={styles.item}>
          <div className={styles.text}>
            <span>{describePlace(point)}</span>
            <span className={styles.time}>{formatTime(point.timestamp)}</span>
          </div>
          {point.ownerUid === userUid && (
            <button
              type="button"
              className={styles.deleteButton}
              aria-label="Slet check-in"
              onClick={() => void remove(tripId, point.id)}
            >
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
