import { authTexts } from './auth'
import { commonTexts } from './common'
import { tripsTexts } from './trips'

/**
 * Alle tekst-områder. Nøglen i t() er "område.nøgle", f.eks. t('common.save').
 * Nyt område: opret en fil her ved siden af med defineTexts og tilføj den nedenfor.
 */
export const texts = {
  common: commonTexts,
  auth: authTexts,
  trips: tripsTexts,
}
