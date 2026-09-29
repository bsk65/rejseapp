import { useT } from '../../../shared/i18n/useT'
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
  const { t } = useT()
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.playButton}
        onClick={onTogglePlay}
        aria-label={playing ? t('summary.pause') : t('summary.play')}
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
        aria-label={t('summary.scrubber')}
      />
      <button
        type="button"
        className={styles.smallButton}
        onClick={onCycleSpeed}
        aria-label={t('summary.speed')}
      >
        {speed}×
      </button>
      <button
        type="button"
        className={styles.smallButton}
        onClick={onRestart}
        aria-label={t('summary.restart')}
      >
        ↺
      </button>
    </div>
  )
}
