import type { ReactNode } from 'react'
import { displayNameOf } from '../logic/displayName'
import { useProfiles } from '../hooks/useProfiles'
import { PeopleContext } from '../people'

/** Henter navnene på rejsens medlemmer én gang for hele rejsesiden. */
export function PeopleProvider({
  selfUid,
  memberUids,
  guestUids,
  children,
}: {
  selfUid: string
  memberUids: string[]
  guestUids: string[]
  children: ReactNode
}) {
  const profiles = useProfiles(memberUids)
  const travellers = memberUids.filter((uid) => !guestUids.includes(uid))
  const value = {
    selfUid,
    memberUids: travellers,
    guestUids,
    shared: travellers.length > 1,
    nameOf: (uid: string) => displayNameOf(profiles[uid]) ?? '…',
  }
  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>
}
