import {
  collection,
  deleteDoc,
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
import type { Friend } from './types'

function friendsCollection(ownerUid: string) {
  return collection(db, 'users', ownerUid, 'friends')
}

export async function ensureUserProfile(uid: string, email: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { uid, email: email.toLowerCase() }, { merge: true })
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
