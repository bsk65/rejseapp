import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type FieldValue,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Stay, StayDetails } from './types'

function staysCollection(tripId: string) {
  return collection(db, 'trips', tripId, 'stays')
}

function toStay(docSnap: QueryDocumentSnapshot<DocumentData>): Stay {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    name: data.name ?? '',
    place: data.place ?? undefined,
    checkInDate: data.checkInDate,
    checkInTime: data.checkInTime ?? undefined,
    checkOutDate: data.checkOutDate,
    checkOutTime: data.checkOutTime ?? undefined,
    bookingRef: data.bookingRef ?? undefined,
    accessCode: data.accessCode ?? undefined,
    wifi: data.wifi ?? undefined,
    hostPhone: data.hostPhone ?? undefined,
    note: data.note ?? undefined,
    price: data.price ?? undefined,
    priceFor: data.priceFor ?? undefined,
    travelerUids: data.travelerUids ?? undefined,
    ownerUid: data.ownerUid,
    memberUids: data.memberUids ?? [data.ownerUid],
  }
}

export function subscribeToStays(
  tripId: string,
  memberUid: string,
  onChange: (stays: Stay[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  // where('memberUids', 'array-contains', ...) skal med, ellers afviser
  // Firestore hele list-queryet. Se CLAUDE.md.
  const q = query(
    staysCollection(tripId),
    where('memberUids', 'array-contains', memberUid),
    orderBy('checkInDate', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toStay)), onError)
}

/** Nye dokumenter: tomme felter udelades (Firestore afviser undefined). */
function withoutEmpty(details: StayDetails): Partial<StayDetails> {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as Partial<StayDetails>
}

/** Opdateringer: et felt, der er tømt i formularen, slettes også i Firestore. */
function toPatch(details: StayDetails): Record<string, unknown | FieldValue> {
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      value === undefined ? deleteField() : value,
    ]),
  )
}

export async function createStay(
  tripId: string,
  creatorUid: string,
  memberUids: string[],
  details: StayDetails,
): Promise<void> {
  await addDoc(staysCollection(tripId), {
    ...withoutEmpty(details),
    ownerUid: creatorUid,
    memberUids,
    createdAt: serverTimestamp(),
  })
}

export async function updateStay(
  tripId: string,
  stayId: string,
  details: StayDetails,
): Promise<void> {
  await updateDoc(doc(staysCollection(tripId), stayId), toPatch(details))
}

export async function deleteStay(tripId: string, stayId: string): Promise<void> {
  await deleteDoc(doc(staysCollection(tripId), stayId))
}
