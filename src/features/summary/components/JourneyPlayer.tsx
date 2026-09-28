import { useMemo } from 'react'
import { formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import type { Day } from '../../days/types'
import { usePlayback } from '../hooks/usePlayback'
import { formatKm } from '../logic/formatKm'
import { buildJourneyPath } from '../logic/journeyPath'
import { buildTimeline, stateAt } from '../logic/timeline'
import type { JourneyStop } from '../types'
import { JourneyMap } from './JourneyMap'
import { JourneyPhoto } from './JourneyPhoto'
import { PlaybackControls } from './PlaybackControls'
import styles from './JourneyPlayer.module.css'

/** Afspilning af rejsen på kortet: kort med overlays + knapper. Kræver mindst to stop. */
export function JourneyPlayer({ stops, days }: { stops: JourneyStop[]; days: Day[] }) {
  const timeline = useMemo(() => buildTimeline(stops), [stops])
  const path = useMemo(() => buildJourneyPath(stops), [stops])
  const playback = usePlayback(timeline.duration)
  const state = stateAt(stops, timeline, playback.elapsed)

  const stop = stops[state.stopIndex]
  const day = days.find((d) => d.dayNumber === stop.dayNumber)
  const holding = state.holdingStop === null ? undefined : stops[state.holdingStop]
  const nextPhoto = stops.find((s, i) => i > state.stopIndex && s.kind === 'foto')
  const started = playback.elapsed > 0
  const finished = playback.elapsed >= timeline.duration
  const follow = playback.playing || (started && !finished)

  return (
    <div className={styles.player}>
      <div className={styles.stage}>
        <JourneyMap stops={stops} path={path} state={state} follow={follow} />

        <div className={styles.topOverlay}>
          <span
            className={styles.dayChip}
            data-day-color={day ? dayColorIndex(day.dayNumber) : undefined}
          >
            {day ? `Dag ${day.dayNumber} · ${formatDayDate(day.date)}` : formatStopDate(stop.time)}
          </span>
          <span className={styles.kmChip}>{formatKm(state.km)}</span>
        </div>

        {holding?.label && <p className={styles.placeLabel}>{holding.label}</p>}

        {holding?.storagePath && <JourneyPhoto storagePath={holding.storagePath} />}
        {/* Næste billede hentes i forvejen (skjult), så det er klar, når det skal vises. */}
        {nextPhoto?.storagePath && nextPhoto !== holding && (
          <JourneyPhoto storagePath={nextPhoto.storagePath} hidden />
        )}
      </div>

      <PlaybackControls
        elapsed={playback.elapsed}
        duration={timeline.duration}
        playing={playback.playing}
        speed={playback.speed}
        onTogglePlay={playback.togglePlay}
        onRestart={playback.restart}
        onCycleSpeed={playback.cycleSpeed}
        onSeek={playback.seek}
      />
    </div>
  )
}

function formatStopDate(time: number): string {
  return new Date(time).toLocaleDateString('da-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
