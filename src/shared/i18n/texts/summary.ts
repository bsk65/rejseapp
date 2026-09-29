import { defineTexts } from '../translate'

/** Fanen "Afspil": nøgletal og afspilning af rejsen. */
export const summaryTexts = defineTexts({
  da: {
    statDays: 'Dage',
    statDistance: 'Tilbagelagt',
    statPhotos: 'Billeder på kortet',
    statCheckIns: 'Check-ins',
    notEnough:
      'Der er endnu ikke nok at afspille. Tilføj Fra/Til-steder på dagene, spor turen, eller upload billeder med GPS-position — så kan hele rejsen afspilles her.',
    pause: 'Pause',
    play: 'Afspil',
    scrubber: 'Hvor langt i rejsen',
    speed: 'Skift hastighed',
    restart: 'Afspil forfra',
  },
  en: {
    statDays: 'Days',
    statDistance: 'Travelled',
    statPhotos: 'Photos on the map',
    statCheckIns: 'Check-ins',
    notEnough:
      'There is not enough to play yet. Add From/To places to the days, track the trip, or upload photos with a GPS location — then the whole trip can be played here.',
    pause: 'Pause',
    play: 'Play',
    scrubber: 'How far into the trip',
    speed: 'Change speed',
    restart: 'Play from the start',
  },
})
