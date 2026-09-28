import { useEffect } from 'react'

/**
 * Holder skærmen tændt mens `active` er sand — bruges under GPS-sporing
 * (browseren stopper typisk GPS-målinger, når skærmen slukker) og mens et
 * boardingkort vises. Browseren frigiver låsen selv når fanen
 * skjules, så den genanmodes når fanen bliver synlig igen. Understøttes
 * Wake Lock ikke, sker der bare ingenting.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    async function request() {
      try {
        const next = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void next.release()
        } else {
          sentinel = next
        }
      } catch {
        // F.eks. strømsparetilstand — alt virker stadig, skærmen kan bare slukke.
      }
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      void sentinel?.release()
    }
  }, [active])
}
