import { useState } from 'react'
import { addFriend, findUserByEmail } from '../repository'

export function useAddFriendByEmail(ownerUid: string | undefined) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addByEmail(email: string): Promise<boolean> {
    const trimmed = email.trim()
    if (!ownerUid || !trimmed) return false

    setPending(true)
    setError(null)
    try {
      const found = await findUserByEmail(trimmed)
      if (!found) {
        setError('Ingen bruger fundet med den e-mail.')
        return false
      }
      if (found.uid === ownerUid) {
        setError('Du kan ikke tilføje dig selv som ven.')
        return false
      }
      await addFriend(ownerUid, found)
      return true
    } catch {
      setError('Kunne ikke tilføje ven. Prøv igen.')
      return false
    } finally {
      setPending(false)
    }
  }

  return { addByEmail, pending, error }
}
