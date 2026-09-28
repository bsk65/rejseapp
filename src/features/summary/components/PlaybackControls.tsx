import type { PlaybackSpeed } from '../hooks/usePlayback'
import styles from './PlaybackControls.module.css'

export function PlaybackControls({
  elapsed,
  duration,
  playing,
  speed,
  onTogglePlay,
  onRestart,
  onCycleSpeed,
  onSeek,
}: {
  elapsed: number
  duration: number
  playing: boolean
  speed: PlaybackSpeed
  onTogglePlay: () => void
  onRestart: () => void
  onCycleSpeed: () => void
  onSeek: (ms: number) => void
}) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.playButton}
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause' : 'Afspil'}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <input
        type="range"
        className={styles.scrubber}
        min={0}
        max={duration}
        step={50}
        value={elapsed}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="Hvor langt i rejsen"
      />
      <button
        type="button"
        className={styles.smallButton}
        onClick={onCycleSpeed}
        aria-label="Skift hastighed"
      >
        {speed}×
      </button>
      <button
        type="button"
        className={styles.smallButton}
        onClick={onRestart}
        aria-label="Afspil forfra"
      >
        ↺
      </button>
    </div>
  )
}
