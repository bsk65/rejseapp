import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { addDaysToIsoDate } from '../../shared/utils/date'
import type { Place } from '../../shared/types/place'
import type { Day } from './types'

function daysCollection(tripId: string) {
  return collection(db, 'trips', tripId, 'days')
}

function toDay(docSnap: QueryDocumentSnapshot<DocumentData>): Day {
  const data = docSnap.data()
  return {
    id: docSnap.id,
    dayNumber: data.dayNumber,
    date: data.date,
    fromPlace: data.fromPlace ?? undefined,
    toPlace: data.toPlace ?? undefined,
    note: data.note ?? undefined,
    ownerUid: data.ownerUid,
    memberUids: data.memberUids ?? [data.ownerUid],
  }
}

export function subscribeToDays(
  tripId: string,
  memberUid: string,
  onChange: (days: Day[]) => void,
): Unsubscribe {
  // where('memberUids', 'array-contains', ...) skal med, ellers afviser
  // Firestore hele list-queryet. Se CLAUDE.md.
  const q = query(
    daysCollection(tripId),
    where('memberUids', 'array-contains', memberUid),
    orderBy('dayNumber', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toDay)))
}

export async function createDaysForTrip(
  tripId: string,
  creatorUid: string,
  memberUids: string[],
  numDays: number,
  startDate: string,
): Promise<void> {
  const batch = writeBatch(db)
  for (let dayNumber = 1; dayNumber <= numDays; dayNumber++) {
    batch.set(doc(daysCollection(tripId)), {
      dayNumber,
      date: addDaysToIsoDate(startDate, dayNumber - 1),
      ownerUid: creatorUid,
      memberUids,
    })
  }
  await batch.commit()
}

export async function updateDayPlace(
  tripId: string,
  dayId: string,
  field: 'fromPlace' | 'toPlace',
  place: Place,
): Promise<void> {
  await updateDoc(doc(daysCollection(tripId), dayId), { [field]: place })
}

/** Sætter "Til" på én dag og "Fra" på næste dag i samme skrivning. */
export async function updateToPlaceAndNextFrom(
  tripId: string,
  dayId: string,
  nextDayId: string,
  place: Place,
): Promise<void> {
  const batch = writeBatch(db)
  batch.update(doc(daysCollection(tripId), dayId), { toPlace: place })
  batch.update(doc(daysCollection(tripId), nextDayId), { fromPlace: place })
  await batch.commit()
}
