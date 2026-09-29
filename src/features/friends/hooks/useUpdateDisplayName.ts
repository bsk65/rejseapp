import { useState } from 'react'
import { updateDisplayName } from '../repository'

export function useUpdateDisplayName() {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function save(uid: string, name: string): Promise<boolean> {
    setPending(true)
    setFailed(false)
    try {
      await updateDisplayName(uid, name)
      return true
    } catch {
      setFailed(true)
      return false
    } finally {
      setPending(false)
    }
  }

  return { save, pending, failed }
}
