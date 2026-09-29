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
import { deleteObject, ref, uploadBytes } from 'firebase/storage'
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

/**
 * Sletter alle rejsens billeder (bruges når hele rejsen slettes). Kun trippens
 * ejer kalder den. Slette-reglen slår trippen op med get() for andres billeder,
 * og Firestore tillader kun 20 get()-kald pr. batch — derfor små batches.
 * Storage lader kun uploaderen slette sin fil, så rejsefællers billedfiler
 * efterlades (de kan ikke længere findes, når dokumentet er væk).
 */
export async function deleteTripPhotos(tripId: string, tripOwnerUid: string): Promise<void> {
  // Ejeren er altid med i photoViewerUids, så filteret rammer alle billeder.
  const snapshot = await getDocs(
    query(photosCollection(tripId), where('photoViewerUids', 'array-contains', tripOwnerUid)),
  )
  const DELETE_BATCH_SIZE = 20
  for (let start = 0; start < snapshot.docs.length; start += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db)
    snapshot.docs.slice(start, start + DELETE_BATCH_SIZE).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  await Promise.all(
    snapshot.docs.map((d) =>
      deleteObject(ref(storage, (d.data() as { storagePath: string }).storagePath)).catch(
        () => undefined,
      ),
    ),
  )
}
