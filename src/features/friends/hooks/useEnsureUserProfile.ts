import { useEffect } from 'react'
import { ensureUserProfile } from '../repository'

export function useEnsureUserProfile(uid: string | undefined, email: string | null | undefined) {
  useEffect(() => {
    if (!uid || !email) return
    void ensureUserProfile(uid, email)
  }, [uid, email])
}
