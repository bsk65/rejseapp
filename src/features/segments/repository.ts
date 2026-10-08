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
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { deleteObject, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { removeOfflineFile } from '../../shared/api/offlineFiles'
import type {
  BoardingPassImage,
  Segment,
  SegmentDetails,
  SegmentStatus,
  TransportMode,
} from './types'

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
    price: data.price ?? undefined,
    boardingPasses: data.boardingPasses ?? undefined,
    travelerUids: data.travelerUids ?? undefined,
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

/** Sletter segmentet og dets gemte boardingkort-billeder (dem, man selv har lov at slette). */
export async function deleteSegment(
  tripId: string,
  dayId: string,
  segmentId: string,
  boardingPasses: BoardingPassImage[] = [],
): Promise<void> {
  await deleteDoc(doc(segmentsCollection(tripId, dayId), segmentId))
  await Promise.all(boardingPasses.map((pass) => deleteStorageFile(pass.storagePath)))
}

/** Storage tillader kun ejeren at slette — en rejsefælles fil efterlades bare. */
export function deleteStorageFile(storagePath: string): Promise<void> {
  void removeOfflineFile(storagePath).catch(() => undefined)
  return deleteObject(ref(storage, storagePath)).catch(() => undefined)
}

/**
 * Gemmer billedet af et boardingkort i Storage og returnerer stien. Ligger i
 * uploaderens egen mappe under rejsen (samme regel som billeder, se storage.rules).
 */
export async function uploadBoardingPassImage(
  tripId: string,
  ownerUid: string,
  file: File,
  prefix: 'boardingkort' | 'billet' = 'boardingkort',
): Promise<string> {
  const storagePath = `trips/${tripId}/${ownerUid}/${prefix}-${crypto.randomUUID()}`
  await uploadBytes(ref(storage, storagePath), file, { contentType: file.type || 'image/jpeg' })
  return storagePath
}

/** Gemmer segmentets nye liste af boardingkort/billetter (efter en upload). */
export async function saveBoardingPasses(
  tripId: string,
  dayId: string,
  segmentId: string,
  passes: BoardingPassImage[],
): Promise<void> {
  await updateDoc(doc(segmentsCollection(tripId, dayId), segmentId), { boardingPasses: passes })
}

/** Fjerner ét boardingkort fra flyet (og filen, hvis man selv har gemt den). */
export async function removeBoardingPass(
  tripId: string,
  dayId: string,
  segmentId: string,
  remaining: BoardingPassImage[],
  removedPath: string,
): Promise<void> {
  await updateDoc(doc(segmentsCollection(tripId, dayId), segmentId), {
    boardingPasses: remaining,
  })
  await deleteStorageFile(removedPath)
}

export async function updateSegment(
  tripId: string,
  dayId: string,
  segmentId: string,
  patch: Partial<SegmentDetails>,
): Promise<void> {
  const data: Record<string, unknown> = stripUndefined(patch)
  // Et tømt prisfelt skal slette prisen — de andre felter udelades bare.
  if ('price' in patch && patch.price === undefined) data.price = deleteField()
  await updateDoc(doc(segmentsCollection(tripId, dayId), segmentId), data)
}

/**
 * Flytter segmentet til en anden dag (afgangsdatoen er ændret). Segmenter ligger
 * under dagen, så det gøres som kopi + sletning i én batch med samme id.
 * Boardingkort-filerne ligger ikke under dagen og skal ikke flyttes.
 */
export async function moveSegment(
  tripId: string,
  fromDayId: string,
  toDayId: string,
  segment: Segment,
  patch: Partial<SegmentDetails>,
): Promise<void> {
  const { id, ...data } = segment
  const batch = writeBatch(db)
  batch.set(doc(segmentsCollection(tripId, toDayId), id), {
    ...stripUndefined({ ...data, ...patch }),
    createdAt: serverTimestamp(),
  })
  batch.delete(doc(segmentsCollection(tripId, fromDayId), id))
  await batch.commit()
}
