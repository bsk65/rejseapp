import { createContext } from 'react'

/** Rejsens medlemmer og deres navne — stilles til rådighed af PeopleProvider. */
export type People = {
  /** Den loggede ind bruger. */
  selfUid: string
  memberUids: string[]
  /** Rejsen er delt (mere end én person) — kun da vises, hvem der er med. */
  shared: boolean
  /** Personens navn (valgt navn, ellers første del af e-mailen). */
  nameOf: (uid: string) => string
}

export const PeopleContext = createContext<People | null>(null)
