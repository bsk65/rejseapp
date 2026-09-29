import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { LangToggle } from '../../../shared/ui/LangToggle'
import { useAuthActions } from '../hooks/useAuthActions'
import { usePrivacyUrl } from '../hooks/usePrivacyUrl'
import styles from './PrivacyGate.module.css'

/**
 * Vises i stedet for appen, indtil brugeren har accepteret den gældende
 * privatlivspolitik (eksisterende brugere, og alle igen når politikken ændres).
 * Kan bevidst ikke lukkes — kun accepteres, eller man kan logge ud.
 */
export function PrivacyGate({ onAccept }: { onAccept: () => Promise<void> }) {
  const { t } = useT()
  const privacyUrl = usePrivacyUrl()
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const { logout } = useAuthActions()

  async function handleContinue() {
    setPending(true)
    setSaveFailed(false)
    try {
      await onAccept()
    } catch {
      setSaveFailed(true)
      setPending(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t('auth.privacyPolicy')}</h1>
          <LangToggle />
        </div>
        <p className={styles.text}>{t('auth.gateText')}</p>
        <a href={privacyUrl} target="_blank" rel="noopener" className={styles.link}>
          {t('auth.gateRead')}
        </a>
        <label className={styles.checkRow}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          {t('auth.gateAccept')}
        </label>
        {saveFailed && <p className={styles.error}>{t('auth.gateSaveError')}</p>}
        <Button type="button" disabled={!checked || pending} onClick={() => void handleContinue()}>
          {t('auth.gateContinue')}
        </Button>
        <button type="button" className={styles.logout} onClick={() => void logout()}>
          {t('auth.logout')}
        </button>
      </div>
    </div>
  )
}
