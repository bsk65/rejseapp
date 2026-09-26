import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Segment, SegmentStatus, TransportMode } from './types'

function segmentsCollection(tripId: string, dayId: string) {
  return collection(db, 'trips', tripId, 'days', dayId, 'segments')
}

function toSegment(docSnap: QueryDocumentSnapshot<DocumentData>): Segment {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    mode: data.mode,
    status: data.status,
    carrier: data.carrier ?? undefined,
    number: data.number ?? undefined,
    departurePlace: data.departurePlace ?? undefined,
    departureTime: data.departureTime ?? undefined,
    arrivalPlace: data.arrivalPlace ?? undefined,
    arrivalTime: data.arrivalTime ?? undefined,
    bookingRef: data.bookingRef ?? undefined,
    freeText: data.freeText ?? undefined,
    ownerUid: data.ownerUid,
  }
}

export function subscribeToSegments(
  tripId: string,
  dayId: string,
  ownerUid: string,
  onChange: (segments: Segment[]) => void,
): Unsubscribe {
  // where('ownerUid', ...) skal med, ellers afviser Firestore hele
  // list-queryet — reglen kan ikke matches per dokument uden det. Se CLAUDE.md.
  const q = query(
    segmentsCollection(tripId, dayId),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toSegment)))
}

export async function createSegment(
  tripId: string,
  dayId: string,
  ownerUid: string,
  mode: TransportMode,
): Promise<void> {
  await addDoc(segmentsCollection(tripId, dayId), {
    mode,
    status: 'planlagt' satisfies SegmentStatus,
    ownerUid,
    createdAt: serverTimestamp(),
  })
}
