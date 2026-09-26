import { useEffect, useState } from 'react'
import { subscribeToFriends } from '../repository'
import type { Friend } from '../types'

export function useFriends(ownerUid: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ownerUid) return
    return subscribeToFriends(ownerUid, (next) => {
      setFriends(next)
      setLoading(false)
    })
  }, [ownerUid])

  if (!ownerUid) {
    return { friends: [], loading: false }
  }

  return { friends, loading }
}
