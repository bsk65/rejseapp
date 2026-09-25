import { useState } from 'react'
import { createTrip } from '../repository'
import type { NewTripInput } from '../types'

export function useCreateTrip(ownerUid: string | null) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(input: NewTripInput): Promise<boolean> {
    if (!ownerUid) return false
    setPending(true)
    setError(null)
    try {
      await createTrip(ownerUid, input)
      return true
    } catch {
      setError('Kunne ikke oprette rejsen. Prøv igen.')
      return false
    } finally {
      setPending(false)
    }
  }

  return { create, pending, error }
}
