import {
  addDoc,
  collection,
  deleteDoc,
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
import type { Segment, SegmentDetails, SegmentStatus, TransportMode } from './types'

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
    terminal: data.terminal ?? undefined,
    arrivalPlace: data.arrivalPlace ?? undefined,
    arrivalTime: data.arrivalTime ?? undefined,
    seat: data.seat ?? undefined,
    bookingRef: data.bookingRef ?? undefined,
    freeText: data.freeText ?? undefined,
    ownerUid: data.ownerUid,
    memberUids: data.memberUids ?? [data.ownerUid],
  }
}

/** Firestore afviser `undefined`-felter i skrivninger — de fjernes i stedet for at sendes med. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

export function subscribeToSegments(
  tripId: string,
  dayId: string,
  memberUid: string,
  onChange: (segments: Segment[]) => void,
): Unsubscribe {
  // where('memberUids', 'array-contains', ...) skal med, ellers afviser
  // Firestore hele list-queryet. Se CLAUDE.md.
  const q = query(
    segmentsCollection(tripId, dayId),
    where('memberUids', 'array-contains', memberUid),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toSegment)))
}

export async function createSegment(
  tripId: string,
  dayId: string,
  creatorUid: string,
  memberUids: string[],
  mode: TransportMode,
  details?: Partial<SegmentDetails>,
): Promise<void> {
  await addDoc(segmentsCollection(tripId, dayId), {
    mode,
    status: 'planlagt' satisfies SegmentStatus,
    ownerUid: creatorUid,
    memberUids,
    createdAt: serverTimestamp(),
    ...stripUndefined(details ?? {}),
  })
}

export async function deleteSegment(
  tripId: string,
  dayId: string,
  segmentId: string,
): Promise<void> {
  await deleteDoc(doc(segmentsCollection(tripId, dayId), segmentId))
}

export async function updateSegment(
  tripId: string,
  dayId: string,
  segmentId: string,
  patch: Partial<SegmentDetails>,
): Promise<void> {
  await updateDoc(doc(segmentsCollection(tripId, dayId), segmentId), stripUndefined(patch))
}
