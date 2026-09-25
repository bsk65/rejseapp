import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../../../firebase/config'

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code: string }).code
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Forkert e-mail eller adgangskode.'
    }
    if (code === 'auth/email-already-in-use') {
      return 'Der findes allerede en bruger med denne e-mail.'
    }
    if (code === 'auth/weak-password') {
      return 'Adgangskoden skal være mindst 6 tegn.'
    }
    if (code === 'auth/invalid-email') {
      return 'Ugyldig e-mailadresse.'
    }
  }
  return 'Der skete en fejl. Prøv igen.'
}

export function useAuthActions() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function login(email: string, password: string) {
    setPending(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  async function signup(email: string, password: string) {
    setPending(true)
    setError(null)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return { login, signup, logout, error, pending }
}
