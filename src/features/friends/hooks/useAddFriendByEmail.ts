import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { addFriend, findUserByEmail } from '../repository'

export function useAddFriendByEmail(ownerUid: string | undefined) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<TextKey | null>(null)

  async function addByEmail(email: string): Promise<boolean> {
    const trimmed = email.trim()
    if (!ownerUid || !trimmed) return false

    setPending(true)
    setError(null)
    try {
      const found = await findUserByEmail(trimmed)
      if (!found) {
        setError('trips.errorFriendNotFound')
        return false
      }
      if (found.uid === ownerUid) {
        setError('trips.errorFriendSelf')
        return false
      }
      await addFriend(ownerUid, found)
      return true
    } catch {
      setError('trips.errorFriendAdd')
      return false
    } finally {
      setPending(false)
    }
  }

  return { addByEmail, pending, error }
}
