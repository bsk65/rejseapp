/**
 * Hver dag får en farve fra en fast palet (defineret som --day-color-N i
 * index.css), så dagene er lette at skelne og samme farve kan bruges på
 * kortet. Paletten gentages efter DAY_COLOR_COUNT dage.
 */
export const DAY_COLOR_COUNT = 8

export function dayColorIndex(dayNumber: number): number {
  return (((dayNumber - 1) % DAY_COLOR_COUNT) + DAY_COLOR_COUNT) % DAY_COLOR_COUNT
}

/** Den faktiske farveværdi — MapLibre-markører kan ikke bruge CSS-variabler direkte. */
export function resolveDayColor(dayNumber: number): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--day-color-${dayColorIndex(dayNumber)}`)
    .trim()
}
