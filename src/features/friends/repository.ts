import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Friend, Profile } from './types'

/** Firestores grænse for antal værdier i en `in`-forespørgsel. */
const IN_QUERY_LIMIT = 30

function friendsCollection(ownerUid: string) {
  return collection(db, 'users', ownerUid, 'friends')
}

export async function ensureUserProfile(uid: string, email: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { uid, email: email.toLowerCase() }, { merge: true })
}

/**
 * Følger profilerne (navn og e-mail) for en række brugere — f.eks. en rejses
 * medlemmer. Alle loggede ind må læse users-dokumenter (se firestore.rules).
 */
export function subscribeToProfiles(
  uids: string[],
  onChange: (profiles: Profile[]) => void,
): Unsubscribe {
  const chunks: string[][] = []
  for (let i = 0; i < uids.length; i += IN_QUERY_LIMIT) {
    chunks.push(uids.slice(i, i + IN_QUERY_LIMIT))
  }
  const byChunk = new Map<number, Profile[]>()
  const unsubscribes = chunks.map((chunk, index) =>
    onSnapshot(query(collection(db, 'users'), where('uid', 'in', chunk)), (snapshot) => {
      byChunk.set(
        index,
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return { uid: data.uid, email: data.email, displayName: data.displayName ?? undefined }
        }),
      )
      onChange([...byChunk.values()].flat())
    }),
  )
  return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
}

/** Gemmer (eller fjerner, hvis tomt) ens eget navn på profilen. */
export async function updateDisplayName(uid: string, displayName: string): Promise<void> {
  const name = displayName.trim()
  await setDoc(doc(db, 'users', uid), { displayName: name || deleteField() }, { merge: true })
}

export async function findUserByEmail(email: string): Promise<Friend | null> {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.trim().toLowerCase()),
    limit(1),
  )
  const snapshot = await getDocs(q)
  const docSnap = snapshot.docs[0]
  if (!docSnap) return null
  const data = docSnap.data()
  return { uid: data.uid, email: data.email }
}

export function subscribeToFriends(
  ownerUid: string,
  onChange: (friends: Friend[]) => void,
): Unsubscribe {
  const q = query(friendsCollection(ownerUid), orderBy('email', 'asc'))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((docSnap) => docSnap.data() as Friend))
  })
}

export async function addFriend(ownerUid: string, friend: Friend): Promise<void> {
  await setDoc(doc(friendsCollection(ownerUid), friend.uid), friend)
}

export async function removeFriend(ownerUid: string, friendUid: string): Promise<void> {
  await deleteDoc(doc(friendsCollection(ownerUid), friendUid))
}
