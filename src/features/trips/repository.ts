import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { NewTripInput, Trip, TripStatus } from './types'

const tripsCollection = collection(db, 'trips')

function toTrip(docSnap: QueryDocumentSnapshot<DocumentData>): Trip {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    title: data.title,
    startDate: data.startDate,
    days: data.days,
    destinations: data.destinations ?? [],
    ownerUid: data.ownerUid,
    status: data.status,
    createdAt: data.createdAt ?? null,
  }
}

export function subscribeToTrips(ownerUid: string, onChange: (trips: Trip[]) => void): Unsubscribe {
  const q = query(tripsCollection, where('ownerUid', '==', ownerUid), orderBy('startDate', 'desc'))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map(toTrip))
  })
}

export function subscribeToTrip(
  tripId: string,
  onChange: (trip: Trip | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'trips', tripId),
    (snap) => onChange(snap.exists() ? toTrip(snap) : null),
    () => onChange(null),
  )
}

export async function createTrip(ownerUid: string, input: NewTripInput): Promise<string> {
  const docRef = await addDoc(tripsCollection, {
    title: input.title,
    startDate: input.startDate,
    days: input.days,
    destinations: input.destinations,
    ownerUid,
    status: 'planlagt' satisfies TripStatus,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateTripStatus(tripId: string, status: TripStatus): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), { status })
}
