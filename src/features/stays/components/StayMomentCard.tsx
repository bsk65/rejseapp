import { formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import { nightCount, type StayMoment } from '../logic/stayDates'
import { BedIcon } from './BedIcon'
import styles from './StayMomentCard.module.css'

/** Ind- eller udtjekning som kort i "Billetter & tider". */
export function StayMomentCard({
  moment,
  dayNumber,
  onSelect,
}: {
  moment: StayMoment
  /** Rejsedagen for datoen, hvis den ligger inden for rejsen. */
  dayNumber?: number
  onSelect: () => void
}) {
  const { stay } = moment
  const nights = nightCount(stay.checkInDate, stay.checkOutDate)
  const isCheckIn = moment.kind === 'indtjek'
  const codes = [stay.accessCode && `Kode ${stay.accessCode}`, stay.wifi && `Wifi ${stay.wifi}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      className={styles.card}
      data-day-color={dayNumber ? dayColorIndex(dayNumber) : undefined}
      onClick={onSelect}
    >
      <div className={styles.top}>
        <span className={styles.time}>{moment.time ?? '--:--'}</span>
        <span className={styles.kind}>
          <BedIcon />
          {isCheckIn ? 'Indtjek' : 'Udtjek'}
        </span>
      </div>

      <p className={styles.name}>
        {stay.name}
        {stay.place?.area && <span className={styles.muted}> · {stay.place.area}</span>}
      </p>

      <p className={styles.meta}>
        {dayNumber && <span className={styles.day}>Dag {dayNumber} · </span>}
        {formatDayDate(moment.date)}
        {isCheckIn && ` · ${nights} ${nights === 1 ? 'nat' : 'nætter'}`}
        {!isCheckIn && !moment.time && ' · tidspunkt ikke angivet'}
      </p>

      {isCheckIn && (stay.bookingRef || codes) && (
        <div className={styles.bottom}>
          {stay.bookingRef && <span className={styles.booking}>{stay.bookingRef}</span>}
          {codes && <span className={styles.muted}>{codes}</span>}
        </div>
      )}
    </button>
  )
}
