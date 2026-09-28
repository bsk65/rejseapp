import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useAuthActions } from '../hooks/useAuthActions'
import styles from './LoginPage.module.css'

type Mode = 'login' | 'signup' | 'reset'

const SUBMIT_LABEL: Record<Mode, string> = {
  login: 'Log ind',
  signup: 'Opret bruger',
  reset: 'Send link',
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetSentTo, setResetSentTo] = useState<string | null>(null)
  const { login, signup, resetPassword, error, pending } = useAuthActions()

  function switchMode(next: Mode) {
    setMode(next)
    setResetSentTo(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'login') await login(email, password)
    else if (mode === 'signup') await signup(email, password)
    else if (await resetPassword(email)) setResetSentTo(email)
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <h1 className={styles.title}>Rejseappen</h1>
        {mode === 'reset' && (
          <p className={styles.info}>
            Skriv din e-mail, så sender vi et link, hvor du kan vælge en ny adgangskode.
          </p>
        )}
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {mode !== 'reset' && (
          <TextField
            label="Adgangskode"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        )}
        {error && <p className={styles.error}>{error}</p>}
        {resetSentTo && (
          <p className={styles.success}>
            Hvis der findes en bruger med {resetSentTo}, er der nu sendt et link dertil. Tjek også
            spam-mappen. Når du har valgt en ny adgangskode, kan du logge ind her.
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {SUBMIT_LABEL[mode]}
        </Button>

        {mode === 'login' && (
          <button type="button" className={styles.switchMode} onClick={() => switchMode('reset')}>
            Glemt adgangskode?
          </button>
        )}
        <button
          type="button"
          className={styles.switchMode}
          onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login'
            ? 'Ny her? Opret en bruger'
            : mode === 'signup'
              ? 'Har du allerede en bruger? Log ind'
              : 'Tilbage til log ind'}
        </button>
      </form>
    </div>
  )
}
