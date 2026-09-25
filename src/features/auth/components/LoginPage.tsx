import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useAuthActions } from '../hooks/useAuthActions'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, signup, error, pending } = useAuthActions()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'login') {
      void login(email, password)
    } else {
      void signup(email, password)
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Rejseappen</h1>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Adgangskode"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" disabled={pending}>
          {mode === 'login' ? 'Log ind' : 'Opret bruger'}
        </Button>
        <button
          type="button"
          className={styles.switchMode}
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Ny her? Opret en bruger' : 'Har du allerede en bruger? Log ind'}
        </button>
      </form>
    </div>
  )
}
