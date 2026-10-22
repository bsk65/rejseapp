/**
 * Ref-callback, der sætter CSS-variabler (f.eks. `--start`) på et element.
 * Kalenderens placeringer afhænger af klokkeslæt, så de kan ikke ligge fast i
 * CSS — men selve stylingen (hvordan variablerne bruges) gør stadig. Se CLAUDE.md.
 */
export function cssVars(vars: Record<string, number>) {
  return (element: HTMLElement | null) => {
    if (!element) return
    Object.entries(vars).forEach(([name, value]) =>
      element.style.setProperty(`--${name}`, String(value)),
    )
  }
}
