import { useEffect, useState } from 'react'
import { hasAcceptedCurrentPolicy, PRIVACY_VERSION } from '../privacyVersion'
import { acceptPrivacyPolicy, subscribeToAcceptedPrivacyVersion } from '../repository'

/**
 * 'missing' = brugeren har ikke accepteret den gældende version og skal
 * bedes om det. Ved en læsefejl ('error') spærres appen ikke — hellere lade
 * brugeren komme ind end at låse dem ude pga. f.eks. dårlig forbindelse.
 */
export type ConsentStatus = 'loading' | 'accepted' | 'missing' | 'error'

export function usePrivacyConsent(uid: string | undefined) {
  const [loaded, setLoaded] = useState<{ uid: string; status: ConsentStatus } | null>(null)

  useEffect(() => {
    if (!uid) return
    return subscribeToAcceptedPrivacyVersion(
      uid,
      (version) =>
        setLoaded({ uid, status: hasAcceptedCurrentPolicy(version) ? 'accepted' : 'missing' }),
      () => setLoaded({ uid, status: 'error' }),
    )
  }, [uid])

  // En status hentet for en tidligere bruger gælder ikke for den nye.
  const status: ConsentStatus = uid && loaded?.uid === uid ? loaded.status : 'loading'

  async function accept(): Promise<void> {
    if (uid) await acceptPrivacyPolicy(uid, PRIVACY_VERSION)
  }

  return { status, accept }
}
