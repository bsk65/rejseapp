import { authTexts } from './auth'
import { commonTexts } from './common'
import { costsTexts } from './costs'
import { daysTexts } from './days'
import { peopleTexts } from './people'
import { reservationsTexts } from './reservations'
import { segmentsTexts } from './segments'
import { staysTexts } from './stays'
import { summaryTexts } from './summary'
import { trackingTexts } from './tracking'
import { tripsTexts } from './trips'

/**
 * Alle tekst-områder. Nøglen i t() er "område.nøgle", f.eks. t('common.save').
 * Nyt område: opret en fil her ved siden af med defineTexts og tilføj den nedenfor.
 */
export const texts = {
  common: commonTexts,
  auth: authTexts,
  trips: tripsTexts,
  days: daysTexts,
  segments: segmentsTexts,
  stays: staysTexts,
  reservations: reservationsTexts,
  tracking: trackingTexts,
  summary: summaryTexts,
  people: peopleTexts,
  costs: costsTexts,
}
