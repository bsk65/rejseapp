import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
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
    if (code === 'auth/too-many-requests') {
      return 'For mange forsøg lige nu. Vent lidt, og prøv igen.'
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

  /**
   * Sender en mail med et link til at vælge ny adgangskode (Firebases egen
   * side). Firebase afslører ikke, om e-mailen findes — derfor samme
   * besked uanset hvad. Returnerer true, når mailen er sendt afsted.
   */
  async function resetPassword(email: string): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      auth.languageCode = 'da'
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (err) {
      setError(toErrorMessage(err))
      return false
    } finally {
      setPending(false)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return { login, signup, resetPassword, logout, error, pending }
}
