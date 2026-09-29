import { useContext } from 'react'
import { PeopleContext, type People } from '../people'

const NOBODY: People = { selfUid: '', memberUids: [], shared: false, nameOf: () => '…' }

/** Rejsens medlemmer og navne (fra PeopleProvider på rejsesiden). */
export function usePeople(): People {
  return useContext(PeopleContext) ?? NOBODY
}
