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
  }
}

export function subscribeToDays(
  tripId: string,
  ownerUid: string,
  onChange: (days: Day[]) => void,
): Unsubscribe {
  // where('ownerUid', ...) skal med, ellers afviser Firestore hele
  // list-queryet — reglen kan ikke matches per dokument uden det. Se CLAUDE.md.
  const q = query(
    daysCollection(tripId),
    where('ownerUid', '==', ownerUid),
    orderBy('dayNumber', 'asc'),
  )
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toDay)))
}

export async function createDaysForTrip(
  tripId: string,
  ownerUid: string,
  numDays: number,
  startDate: string,
): Promise<void> {
  const batch = writeBatch(db)
  for (let dayNumber = 1; dayNumber <= numDays; dayNumber++) {
    batch.set(doc(daysCollection(tripId)), {
      dayNumber,
      date: addDaysToIsoDate(startDate, dayNumber - 1),
      ownerUid,
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
