/** Gælder prisen for alle rejsende tilsammen ('alle') eller for hver person ('person')? */
export type PriceFor = 'alle' | 'person'

/**
 * Prisen på en booking (transport, overnatning, reservation). Beløbet gemmes i
 * den valuta, man har betalt i; `dkk` er omregnet med dagens kurs, da prisen
 * blev gemt — så totalen ikke flytter sig, hver gang kursen gør.
 */
export type Price = {
  amount: number
  /** ISO 4217-kode med store bogstaver, f.eks. "DKK", "EUR", "IDR". */
  currency: string
  /** Beløbet i danske kroner. Mangler, hvis kursen ikke kunne hentes (f.eks. offline). */
  dkk?: number
  /** Datoen for den kurs, `dkk` er regnet med (YYYY-MM-DD). */
  rateDate?: string
}
