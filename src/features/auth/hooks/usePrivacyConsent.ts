import { useEffect, useState } from 'react'
import { hasAcceptedCurrentPolicy, PRIVACY_VERSION } from '../privacyVersion'
import { acceptPrivacyPolicy, subscribeToAcceptedPrivacyVersion } from '../repository'

/**
 * 'missing' = brugeren har ikke accepteret den gældende version og skal
 * bedes om det. Ved en læsefejl ('error') spærres appen ikke — hellere lade
 * brugeren komme ind end at låse dem ude pga. f.eks. dårlig forbindelse.
 */
export type ConsentStatus = 'loading' | 'accepted' | 'missing' | 'error'

const STORAGE_KEY = 'rejseappen_privacy_accepted'

/**
 * Accepten huskes også på enheden. Uden forbindelse kommer serverens svar
 * aldrig, og appen ville ellers blive ved med at vente (tom skærm) — selvom
 * man har accepteret for længst.
 */
function rememberedVersion(uid: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY}_${uid}`)
  } catch {
    return null
  }
}

function remember(uid: string, version: string | null): void {
  try {
    if (version) localStorage.setItem(`${STORAGE_KEY}_${uid}`, version)
    else localStorage.removeItem(`${STORAGE_KEY}_${uid}`)
  } catch {
    // Privat browsing o.l. — så må vi bare vente på serveren.
  }
}

export function usePrivacyConsent(uid: string | undefined) {
  const [loaded, setLoaded] = useState<{ uid: string; status: ConsentStatus } | null>(null)

  useEffect(() => {
    if (!uid) return
    return subscribeToAcceptedPrivacyVersion(
      uid,
      (version) => {
        remember(uid, version)
        setLoaded({ uid, status: hasAcceptedCurrentPolicy(version) ? 'accepted' : 'missing' })
      },
      () => setLoaded({ uid, status: 'error' }),
    )
  }, [uid])

  // En status hentet for en tidligere bruger gælder ikke for den nye. Indtil
  // serveren har svaret, bruges den accept, der er husket på enheden.
  const status: ConsentStatus = !uid
    ? 'loading'
    : loaded?.uid === uid
      ? loaded.status
      : hasAcceptedCurrentPolicy(rememberedVersion(uid))
        ? 'accepted'
        : 'loading'

  async function accept(): Promise<void> {
    if (!uid) return
    remember(uid, PRIVACY_VERSION)
    await acceptPrivacyPolicy(uid, PRIVACY_VERSION)
  }

  return { status, accept }
}
