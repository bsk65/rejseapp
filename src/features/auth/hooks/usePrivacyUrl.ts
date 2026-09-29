import { useT } from '../../../shared/i18n/useT'
import { PRIVACY_URL, PRIVACY_URL_EN } from '../privacyVersion'

/** Adressen på privatlivspolitikken på det valgte sprog. */
export function usePrivacyUrl(): string {
  const { lang } = useT()
  return lang === 'en' ? PRIVACY_URL_EN : PRIVACY_URL
}
