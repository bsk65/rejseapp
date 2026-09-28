import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { computeViewerUids } from '../../shared/utils/computeViewerUids'
import type { Photo } from './types'

function photosCollection(tripId: string) {
  return collection(db, 'trips', tripId, 'photos')
}

function toPhoto(docSnap: QueryDocumentSnapshot<DocumentData>): Photo {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    storagePath: data.storagePath,
    takenAt: data.takenAt ?? undefined,
    location: data.location ?? undefined,
    dayId: data.dayId ?? undefined,
    ownerUid: data.ownerUid,
    photoViewerUids: data.photoViewerUids ?? [data.ownerUid],
    uploadedAt: data.uploadedAt ?? null,
  }
}

export function subscribeToPhotos(
  tripId: string,
  viewerUid: string,
  onChange: (photos: Photo[]) => void,
): Unsubscribe {
  // where('photoViewerUids', ...) skal med, ellers afviser Firestore hele
  // list-queryet. Se CLAUDE.md.
  const q = query(
    photosCollection(tripId),
    where('photoViewerUids', 'array-contains', viewerUid),
    orderBy('uploadedAt', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toPhoto)))
}

export async function uploadPhoto(
  tripId: string,
  ownerUid: string,
  photoViewerUids: string[],
  file: File,
  extra: { takenAt?: string; location?: { lat: number; lng: number }; dayId?: string },
): Promise<void> {
  const docRef = doc(photosCollection(tripId))
  const storagePath = `trips/${tripId}/${ownerUid}/${docRef.id}`

  await uploadBytes(ref(storage, storagePath), file)
  await setDoc(docRef, {
    storagePath,
    ownerUid,
    photoViewerUids,
    uploadedAt: serverTimestamp(),
    ...(extra.takenAt ? { takenAt: extra.takenAt } : {}),
    ...(extra.location ? { location: extra.location } : {}),
    ...(extra.dayId ? { dayId: extra.dayId } : {}),
  })
}

export function getPhotoUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(storage, storagePath))
}

export async function deletePhoto(
  tripId: string,
  photoId: string,
  storagePath: string,
): Promise<void> {
  await deleteDoc(doc(photosCollection(tripId), photoId))
  await deleteObject(ref(storage, storagePath)).catch(() => undefined)
}

/**
 * Genberegner photoViewerUids på alle eksisterende billeder når trippens
 * sharedCategories.photos ændres — samme cascade-mønster som
 * updateTripMembers i trips/repository.ts, men beregnet pr. billede da hvert
 * billede kan have en anden uploader. Se CLAUDE.md.
 */
export async function cascadePhotoSharing(
  tripId: string,
  sharePhotos: boolean,
  memberUids: string[],
  tripOwnerUid: string,
): Promise<void> {
  // Trippens ejer er altid med i photoViewerUids (se computeViewerUids), så
  // dette filter rammer alle billeder — og det skal med, ellers afviser
  // Firestore list-queryet. Se CLAUDE.md.
  const snapshot = await getDocs(
    query(photosCollection(tripId), where('photoViewerUids', 'array-contains', tripOwnerUid)),
  )
  if (snapshot.empty) return

  const batch = writeBatch(db)
  snapshot.docs.forEach((photoDoc) => {
    const ownerUid = (photoDoc.data() as { ownerUid: string }).ownerUid
    batch.update(photoDoc.ref, {
      photoViewerUids: computeViewerUids(sharePhotos, memberUids, tripOwnerUid, ownerUid),
    })
  })
  await batch.commit()
}
