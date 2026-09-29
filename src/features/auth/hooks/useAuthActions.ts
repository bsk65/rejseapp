import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../../../firebase/config'
import { getLang } from '../../../shared/i18n/lang'
import type { TextKey } from '../../../shared/i18n/translator'
import { PRIVACY_VERSION } from '../privacyVersion'
import { acceptPrivacyPolicy } from '../repository'

/** Fejlen som tekst-nøgle, så den vises på det aktuelle sprog, også efter et sprogskift. */
function toErrorKey(error: unknown): TextKey {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code: string }).code
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'auth.errorCredentials'
    }
    if (code === 'auth/email-already-in-use') {
      return 'auth.errorEmailInUse'
    }
    if (code === 'auth/weak-password') {
      return 'auth.errorWeakPassword'
    }
    if (code === 'auth/invalid-email') {
      return 'auth.errorInvalidEmail'
    }
    if (code === 'auth/too-many-requests') {
      return 'auth.errorTooMany'
    }
  }
  return 'auth.errorGeneric'
}

export function useAuthActions() {
  const [error, setError] = useState<TextKey | null>(null)
  const [pending, setPending] = useState(false)

  async function login(email: string, password: string) {
    setPending(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(toErrorKey(err))
    } finally {
      setPending(false)
    }
  }

  async function signup(email: string, password: string) {
    setPending(true)
    setError(null)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      // Accepten blev givet med hakket i formularen (kræves for at oprette).
      await acceptPrivacyPolicy(credential.user.uid, PRIVACY_VERSION)
    } catch (err) {
      setError(toErrorKey(err))
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
      auth.languageCode = getLang()
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (err) {
      setError(toErrorKey(err))
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
