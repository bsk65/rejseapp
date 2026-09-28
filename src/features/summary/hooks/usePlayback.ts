import { useCallback, useEffect, useRef, useState } from 'react'

export const PLAYBACK_SPEEDS = [1, 2, 4] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

/**
 * Afspilnings-ur: tæller `elapsed` (ms) op fra 0 til `duration` med
 * requestAnimationFrame, mens der afspilles. Stopper af sig selv ved slutningen.
 */
export function usePlayback(duration: number) {
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)
  const elapsedRef = useRef(0)

  const seek = useCallback(
    (ms: number) => {
      const next = Math.min(duration, Math.max(0, ms))
      elapsedRef.current = next
      setElapsed(next)
    },
    [duration],
  )

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()

    function tick(now: number) {
      const next = Math.min(duration, elapsedRef.current + (now - last) * speed)
      last = now
      elapsedRef.current = next
      setElapsed(next)
      if (next >= duration) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed, duration])

  function togglePlay() {
    if (playing) {
      setPlaying(false)
      return
    }
    // Afspil fra start igen, hvis den er spillet færdig.
    if (elapsedRef.current >= duration) seek(0)
    setPlaying(true)
  }

  function cycleSpeed() {
    const index = PLAYBACK_SPEEDS.indexOf(speed)
    setSpeed(PLAYBACK_SPEEDS[(index + 1) % PLAYBACK_SPEEDS.length])
  }

  function restart() {
    seek(0)
    setPlaying(true)
  }

  return { elapsed, playing, speed, togglePlay, cycleSpeed, restart, seek }
}
