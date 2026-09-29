import { useEffect, useState } from 'react'
import { subscribeToProfiles } from '../repository'
import type { Profile } from '../types'

/** Profilerne (navn og e-mail) for de givne brugere, slået op på uid. */
export function useProfiles(uids: string[]): Record<string, Profile> {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  // Samme brugere i en ny række skal ikke starte et nyt abonnement.
  const key = [...new Set(uids)].sort().join(',')

  useEffect(() => {
    if (!key) return
    return subscribeToProfiles(key.split(','), (list) =>
      setProfiles(Object.fromEntries(list.map((profile) => [profile.uid, profile]))),
    )
  }, [key])

  return profiles
}
