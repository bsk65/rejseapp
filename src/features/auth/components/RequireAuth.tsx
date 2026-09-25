import type { ReactNode } from 'react'
import { useAuthUser } from '../hooks/useAuthUser'
import { LoginPage } from './LoginPage'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthUser()

  if (loading) {
    return null
  }

  if (!user) {
    return <LoginPage />
  }

  return children
}
