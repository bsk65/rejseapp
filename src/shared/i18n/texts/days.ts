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
    deleteDay: 'Slet dag',
    deleteConfirm: 'Slet {day} ({date}) fra rejsen?',
    deleteSegments: 'Dagens transport ({count}) slettes også.',
    deletePhotos: 'Dagens billeder ({count}) flyttes til “Billeder uden dag”.',
    deleteYes: 'Ja, slet dagen',
    deleting: 'Sletter…',
    errorDelete: 'Dagen kunne ikke slettes. Prøv igen.',
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
    deleteDay: 'Delete day',
    deleteConfirm: 'Delete {day} ({date}) from the trip?',
    deleteSegments: 'The day’s transport ({count}) will also be deleted.',
    deletePhotos: 'The day’s photos ({count}) will move to “Photos without a day”.',
    deleteYes: 'Yes, delete the day',
    deleting: 'Deleting…',
    errorDelete: 'The day could not be deleted. Please try again.',
  },
})
