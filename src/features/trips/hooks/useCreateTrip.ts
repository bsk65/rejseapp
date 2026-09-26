import { useState } from 'react'
import { createTrip } from '../repository'
import type { NewTripInput } from '../types'

export function useCreateTrip(ownerUid: string | null) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(input: NewTripInput): Promise<string | null> {
    if (!ownerUid) return null
    setPending(true)
    setError(null)
    try {
      return await createTrip(ownerUid, input)
    } catch {
      setError('Kunne ikke oprette rejsen. Prøv igen.')
      return null
    } finally {
      setPending(false)
    }
  }

  return { create, pending, error }
}
