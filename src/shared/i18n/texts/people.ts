import { defineTexts } from '../translate'

/** Navne og "hvem er med" på delte rejser. */
export const peopleTexts = defineTexts({
  da: {
    you: 'Dig',
    everyone: 'Alle',
    travelers: 'Hvem er med?',
    whoseMine: 'Kun mine',
    whoseAll: 'Alles',
    yourName: 'Dit navn',
    nameShown: 'Dit navn: {name}',
    nameHint: 'Vises for dem, du deler rejser med — f.eks. hvem der er med på et fly.',
    addName: 'Tilføj dit navn',
    editName: 'Ret',
    nameSaveError: 'Kunne ikke gemme navnet. Prøv igen.',
    friendName: '{name} ({email})',
  },
  en: {
    you: 'You',
    everyone: 'Everyone',
    travelers: "Who's travelling?",
    whoseMine: 'Only mine',
    whoseAll: "Everyone's",
    yourName: 'Your name',
    nameShown: 'Your name: {name}',
    nameHint: 'Shown to the people you share trips with — e.g. who is on a flight.',
    addName: 'Add your name',
    editName: 'Edit',
    nameSaveError: 'Could not save the name. Please try again.',
    friendName: '{name} ({email})',
  },
})
