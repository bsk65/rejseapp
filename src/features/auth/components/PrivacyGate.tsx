import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { useAuthActions } from '../hooks/useAuthActions'
import { PRIVACY_URL } from '../privacyVersion'
import styles from './PrivacyGate.module.css'

/**
 * Vises i stedet for appen, indtil brugeren har accepteret den gældende
 * privatlivspolitik (eksisterende brugere, og alle igen når politikken ændres).
 * Kan bevidst ikke lukkes — kun accepteres, eller man kan logge ud.
 */
export function PrivacyGate({ onAccept }: { onAccept: () => Promise<void> }) {
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useAuthActions()

  async function handleContinue() {
    setPending(true)
    setError(null)
    try {
      await onAccept()
    } catch {
      setError('Kunne ikke gemme din accept. Tjek forbindelsen, og prøv igen.')
      setPending(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Privatlivspolitik</h1>
        <p className={styles.text}>
          Rejseappen gemmer dine rejser, billeder, boardingkort og — hvis du slår det til — dit
          GPS-spor. Læs, hvordan oplysningerne bruges og deles, og bekræft, at du accepterer
          privatlivspolitikken, for at fortsætte.
        </p>
        <a href={PRIVACY_URL} target="_blank" rel="noopener" className={styles.link}>
          Læs privatlivspolitikken
        </a>
        <label className={styles.checkRow}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          Jeg accepterer privatlivspolitikken
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <Button type="button" disabled={!checked || pending} onClick={() => void handleContinue()}>
          Fortsæt
        </Button>
        <button type="button" className={styles.logout} onClick={() => void logout()}>
          Log ud
        </button>
      </div>
    </div>
  )
}
