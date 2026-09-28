import { useState } from 'react'
import type { Place } from '../../../shared/types/place'
import { addDaysToIsoDate } from '../../../shared/utils/date'
import { stayEventsForDate, type StayEventKind } from '../logic/stayDates'
import type { Stay } from '../types'
import { BedIcon } from './BedIcon'
import { StayForm } from './StayForm'
import styles from './DayStays.module.css'

function describeEvent(kind: StayEventKind, stay: Stay): string {
  if (kind === 'indtjek') return stay.checkInTime ? `Indtjek fra ${stay.checkInTime}` : 'Indtjek'
  if (kind === 'udtjek') return stay.checkOutTime ? `Udtjek senest ${stay.checkOutTime}` : 'Udtjek'
  return 'Nat'
}

/**
 * Dagens overnatninger (indtjek, nat, udtjek) og knappen til at tilføje en
 * ny — med dagen som indtjek og næste dag som udtjek.
 */
export function DayStays({
  tripId,
  userUid,
  memberUids,
  date,
  stays,
  setAsDayTo,
}: {
  tripId: string
  userUid: string
  memberUids: string[]
  date: string
  stays: Stay[]
  setAsDayTo: (place: Place) => Promise<void>
}) {
  const [editing, setEditing] = useState<Stay | 'ny' | null>(null)
  const events = stayEventsForDate(stays, date)

  return (
    <div className={styles.wrapper}>
      {events.length > 0 && (
        <ul className={styles.list}>
          {events.map(({ stay, kind }) => (
            <li key={`${stay.id}:${kind}`}>
              <button
                type="button"
                className={styles.event}
                data-kind={kind}
                onClick={() => setEditing(stay)}
              >
                <BedIcon />
                <span className={styles.text}>
                  <span className={styles.name}>{stay.name}</span>
                  <span className={styles.detail}>{describeEvent(kind, stay)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <StayForm
          key={editing === 'ny' ? 'ny' : editing.id}
          tripId={tripId}
          userUid={userUid}
          memberUids={memberUids}
          stay={editing === 'ny' ? undefined : editing}
          initialCheckIn={date}
          initialCheckOut={addDaysToIsoDate(date, 1)}
          setAsDayTo={setAsDayTo}
          onClose={() => setEditing(null)}
        />
      ) : (
        <button type="button" className={styles.addButton} onClick={() => setEditing('ny')}>
          <BedIcon />
          Tilføj overnatning
        </button>
      )}
    </div>
  )
}
