import { createContext } from 'react'

/** Rejsens medlemmer og deres navne — stilles til rådighed af PeopleProvider. */
export type People = {
  /** Den loggede ind bruger. */
  selfUid: string
  /** De medlemmer, der rejser med — uden dem, der kun kigger med. */
  memberUids: string[]
  /** Medlemmer, der kun kigger med (se Trip.guestUids). */
  guestUids: string[]
  /** Rejsen har mere end én rejsende — kun da vises, hvem der er med. */
  shared: boolean
  /** Personens navn (valgt navn, ellers første del af e-mailen). */
  nameOf: (uid: string) => string
}

export const PeopleContext = createContext<People | null>(null)
