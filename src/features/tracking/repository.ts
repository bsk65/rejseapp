import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { computeViewerUids } from '../../shared/utils/computeViewerUids'
import type { NewTrackPoint, TrackPoint } from './types'

/** Firestore tillader max 500 skrivninger pr. batch — vi holder god afstand. */
const BATCH_SIZE = 400

function trackCollection(tripId: string) {
  return collection(db, 'trips', tripId, 'track')
}

function toTrackPoint(docSnap: QueryDocumentSnapshot<DocumentData>): TrackPoint {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    lat: data.lat,
    lng: data.lng,
    timestamp: data.timestamp,
    source: data.source,
    label: data.label ?? undefined,
    ownerUid: data.ownerUid,
    trackViewerUids: data.trackViewerUids ?? [data.ownerUid],
  }
}

export function subscribeToTrack(
  tripId: string,
  viewerUid: string,
  onChange: (points: TrackPoint[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  // where('trackViewerUids', ...) skal med, ellers afviser Firestore hele
  // list-queryet. Se CLAUDE.md.
  const q = query(
    trackCollection(tripId),
    where('trackViewerUids', 'array-contains', viewerUid),
    orderBy('timestamp', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toTrackPoint)), onError)
}

export async function addTrackPoint(tripId: string, point: NewTrackPoint): Promise<void> {
  const { label, ...rest } = point
  await addDoc(trackCollection(tripId), { ...rest, ...(label ? { label } : {}) })
}

export async function deleteTrackPoint(tripId: string, pointId: string): Promise<void> {
  await deleteDoc(doc(trackCollection(tripId), pointId))
}

/**
 * Genberegner trackViewerUids på alle eksisterende punkter når trippens
 * sharedCategories.track eller medlemsliste ændres — samme mønster som
 * cascadePhotoSharing. En lang GPS-sporing kan have mange punkter, så der
 * deles op i flere batches.
 */
export async function cascadeTrackSharing(
  tripId: string,
  shareTrack: boolean,
  memberUids: string[],
  tripOwnerUid: string,
): Promise<void> {
  // Trippens ejer er altid med i trackViewerUids (se computeViewerUids), så
  // dette filter rammer alle punkter — og det skal med, ellers afviser
  // Firestore list-queryet.
  const snapshot = await getDocs(
    query(trackCollection(tripId), where('trackViewerUids', 'array-contains', tripOwnerUid)),
  )

  for (let start = 0; start < snapshot.docs.length; start += BATCH_SIZE) {
    const batch = writeBatch(db)
    snapshot.docs.slice(start, start + BATCH_SIZE).forEach((pointDoc) => {
      const ownerUid = (pointDoc.data() as { ownerUid: string }).ownerUid
      batch.update(pointDoc.ref, {
        trackViewerUids: computeViewerUids(shareTrack, memberUids, tripOwnerUid, ownerUid),
      })
    })
    await batch.commit()
  }
}
