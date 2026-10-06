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
import type { Reservation, ReservationDetails } from './types'

function reservationsCollection(tripId: string) {
  return collection(db, 'trips', tripId, 'reservations')
}

function toReservation(docSnap: QueryDocumentSnapshot<DocumentData>): Reservation {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    kind: data.kind ?? 'andet',
    name: data.name ?? '',
    place: data.place ?? undefined,
    date: data.date,
    time: data.time ?? undefined,
    bookingRef: data.bookingRef ?? undefined,
    phone: data.phone ?? undefined,
    note: data.note ?? undefined,
    ownerUid: data.ownerUid,
    memberUids: data.memberUids ?? [data.ownerUid],
  }
}

export function subscribeToReservations(
  tripId: string,
  memberUid: string,
  onChange: (reservations: Reservation[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  // where('memberUids', 'array-contains', ...) skal med, ellers afviser
  // Firestore hele list-queryet. Se CLAUDE.md.
  const q = query(
    reservationsCollection(tripId),
    where('memberUids', 'array-contains', memberUid),
    orderBy('date', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toReservation)), onError)
}

/** Nye dokumenter: tomme felter udelades (Firestore afviser undefined). */
function withoutEmpty(details: ReservationDetails): Partial<ReservationDetails> {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as Partial<ReservationDetails>
}

/** Opdateringer: et felt, der er tømt i formularen, slettes også i Firestore. */
function toPatch(details: ReservationDetails): Record<string, unknown | FieldValue> {
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      value === undefined ? deleteField() : value,
    ]),
  )
}

export async function createReservation(
  tripId: string,
  creatorUid: string,
  memberUids: string[],
  details: ReservationDetails,
): Promise<void> {
  await addDoc(reservationsCollection(tripId), {
    ...withoutEmpty(details),
    ownerUid: creatorUid,
    memberUids,
    createdAt: serverTimestamp(),
  })
}

export async function updateReservation(
  tripId: string,
  reservationId: string,
  details: ReservationDetails,
): Promise<void> {
  await updateDoc(doc(reservationsCollection(tripId), reservationId), toPatch(details))
}

export async function deleteReservation(tripId: string, reservationId: string): Promise<void> {
  await deleteDoc(doc(reservationsCollection(tripId), reservationId))
}
