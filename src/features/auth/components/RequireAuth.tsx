import type { ReactNode } from 'react'
import { useEnsureUserProfile } from '../../friends/hooks/useEnsureUserProfile'
import { useAuthUser } from '../hooks/useAuthUser'
import { LoginPage } from './LoginPage'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser()
  useEnsureUserProfile(user?.uid, user?.email)

  if (loading) {
    return null
  }

  if (!user) {
    return <LoginPage />
  }

  return children
}
