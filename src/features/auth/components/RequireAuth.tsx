import type { ReactNode } from 'react'
import { useEnsureUserProfile } from '../../friends/hooks/useEnsureUserProfile'
import { useAuthUser } from '../hooks/useAuthUser'
import { usePrivacyConsent } from '../hooks/usePrivacyConsent'
import { LoginPage } from './LoginPage'
import { PrivacyGate } from './PrivacyGate'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser()
  useEnsureUserProfile(user?.uid, user?.email)
  const consent = usePrivacyConsent(user?.uid)

  if (loading) {
    return null
  }

  if (!user) {
    return <LoginPage />
  }

  // Appen vises først, når det er afklaret, om politikken er accepteret.
  if (consent.status === 'loading') {
    return null
  }

  if (consent.status === 'missing') {
    return <PrivacyGate onAccept={consent.accept} />
  }

  return children
}
