import type { Lang } from './translate'

/** Sprogvalget gemmes kun på denne enhed (ikke i Firestore). */
const STORAGE_KEY = 'rejseappen_lang'

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'da'
  } catch {
    return 'da'
  }
}

let currentLang: Lang = readStoredLang()
const listeners = new Set<() => void>()

export function getLang(): Lang {
  return currentLang
}

export function setLang(lang: Lang): void {
  currentLang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Privat vindue o.l. — sproget gælder så kun, indtil appen lukkes.
  }
  document.documentElement.lang = lang
  listeners.forEach((listener) => listener())
}

export function subscribeToLang(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Sætter <html lang> ved opstart, så den passer til det gemte valg. */
export function applyStoredLang(): void {
  document.documentElement.lang = currentLang
}
