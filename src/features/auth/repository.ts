import { doc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from '../../firebase/config'

/**
 * Hvilken version af privatlivspolitikken brugeren har accepteret (null =
 * ingen). Ligger på brugerens egen profil (users/{uid}), som kun brugeren
 * selv må skrive — se firestore.rules.
 */
export function subscribeToAcceptedPrivacyVersion(
  uid: string,
  onChange: (version: string | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => onChange((snap.data()?.privacyAcceptedVersion as string | undefined) ?? null),
    onError,
  )
}

/** Gemmer accepten. merge, så profilens øvrige felter (uid, email) bevares. */
export async function acceptPrivacyPolicy(uid: string, version: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { privacyAcceptedVersion: version, privacyAcceptedAt: serverTimestamp() },
    { merge: true },
  )
}
