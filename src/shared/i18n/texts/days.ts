import { defineTexts } from '../translate'

/** Fanen Dage. "dayN" bruges også i billetter og afspilning. */
export const daysTexts = defineTexts({
  da: {
    dayN: 'Dag {n}',
    today: 'I dag',
    nothingPlanned: 'Intet planlagt endnu',
    from: 'Fra',
    to: 'Til',
    loading: 'Henter dage…',
    collapseAll: 'Fold alle dage sammen',
    expandAll: 'Fold alle dage ud',
  },
  en: {
    dayN: 'Day {n}',
    today: 'Today',
    nothingPlanned: 'Nothing planned yet',
    from: 'From',
    to: 'To',
    loading: 'Loading days…',
    collapseAll: 'Collapse all days',
    expandAll: 'Expand all days',
  },
})
