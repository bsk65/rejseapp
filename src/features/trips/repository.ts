import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
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
import { deleteObject, ref } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import type { NewTripInput, SharedCategories, Trip, TripStatus } from './types'

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
    memberUids: data.memberUids ?? [data.ownerUid],
    sharedCategories: data.sharedCategories ?? { photos: false, track: false },
    status: data.status,
    createdAt: data.createdAt ?? null,
  }
}

export function subscribeToTrips(
  memberUid: string,
  onChange: (trips: Trip[]) => void,
): Unsubscribe {
  // where('memberUids', 'array-contains', ...) skal med, ellers afviser
  // Firestore hele list-queryet. Se CLAUDE.md.
  const q = query(
    tripsCollection,
    where('memberUids', 'array-contains', memberUid),
    orderBy('startDate', 'desc'),
  )
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
    memberUids: [ownerUid],
    sharedCategories: { photos: false, track: false } satisfies SharedCategories,
    status: 'planlagt' satisfies TripStatus,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateTripStatus(tripId: string, status: TripStatus): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), { status })
}

export async function updateTripSharedCategories(
  tripId: string,
  sharedCategories: SharedCategories,
): Promise<void> {
  await updateDoc(doc(db, 'trips', tripId), { sharedCategories })
}

/**
 * Opdaterer hvem der er medlem af rejsen. Cascader det nye memberUids ned på
 * alle eksisterende days/segments/stays (denormaliseret adgangsfelt, se CLAUDE.md),
 * ellers ville nuværende indhold blive utilgængeligt for de tilføjede/fjernede
 * medlemmer. Client-side batch — antager rejsens samlede days+segments+stays holder
 * sig et godt stykke under Firestores grænse på 500 skrivninger pr. batch.
 */
export async function updateTripMembers(
  tripId: string,
  ownerUid: string,
  memberUids: string[],
): Promise<void> {
  const daysSnapshot = await getDocs(
    query(collection(db, 'trips', tripId, 'days'), where('memberUids', 'array-contains', ownerUid)),
  )

  const staysSnapshot = await getDocs(
    query(
      collection(db, 'trips', tripId, 'stays'),
      where('memberUids', 'array-contains', ownerUid),
    ),
  )

  const segmentsSnapshots = await Promise.all(
    daysSnapshot.docs.map((dayDoc) =>
      getDocs(
        query(collection(dayDoc.ref, 'segments'), where('memberUids', 'array-contains', ownerUid)),
      ),
    ),
  )

  const batch = writeBatch(db)
  batch.update(doc(db, 'trips', tripId), { memberUids })
  daysSnapshot.docs.forEach((dayDoc) => batch.update(dayDoc.ref, { memberUids }))
  staysSnapshot.docs.forEach((stayDoc) => batch.update(stayDoc.ref, { memberUids }))
  segmentsSnapshots.forEach((snapshot) =>
    snapshot.docs.forEach((segDoc) => batch.update(segDoc.ref, { memberUids })),
  )

  await batch.commit()
}

/** Firestore tillader max 500 skrivninger pr. batch — vi holder god afstand. */
const DELETE_BATCH_SIZE = 400

/**
 * Sletter rejsens dage, segmenter og overnatninger (inkl. ejerens egne
 * boardingkort-filer) og til sidst selve rejsen. Billeder og spor slettes
 * først af deres egne features (se useDeleteTrip). Rejse-dokumentet slettes
 * sidst, så en afbrudt sletning kan gentages — reglerne for billeder/spor
 * slår trippen op for at se, om man er dens ejer.
 */
export async function deleteTripContent(tripId: string, ownerUid: string): Promise<void> {
  const daysSnapshot = await getDocs(
    query(collection(db, 'trips', tripId, 'days'), where('memberUids', 'array-contains', ownerUid)),
  )
  const staysSnapshot = await getDocs(
    query(
      collection(db, 'trips', tripId, 'stays'),
      where('memberUids', 'array-contains', ownerUid),
    ),
  )
  const segmentsSnapshots = await Promise.all(
    daysSnapshot.docs.map((dayDoc) =>
      getDocs(
        query(collection(dayDoc.ref, 'segments'), where('memberUids', 'array-contains', ownerUid)),
      ),
    ),
  )
  const segmentDocs = segmentsSnapshots.flatMap((snapshot) => snapshot.docs)
  const refs = [...segmentDocs, ...daysSnapshot.docs, ...staysSnapshot.docs].map((d) => d.ref)

  for (let start = 0; start < refs.length; start += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db)
    refs.slice(start, start + DELETE_BATCH_SIZE).forEach((docRef) => batch.delete(docRef))
    await batch.commit()
  }

  // Storage lader kun uploaderen slette — rejsefællers boardingkort efterlades.
  const boardingPaths = segmentDocs.flatMap((segDoc) =>
    ((segDoc.data().boardingPasses ?? []) as { storagePath: string }[]).map((p) => p.storagePath),
  )
  await Promise.all(
    boardingPaths.map((path) => deleteObject(ref(storage, path)).catch(() => undefined)),
  )

  await deleteDoc(doc(db, 'trips', tripId))
}
