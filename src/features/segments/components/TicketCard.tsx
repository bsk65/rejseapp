import { useT } from '../../../shared/i18n/useT'
import { clockTime, formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import type { Ticket } from '../logic/tickets'
import { transportModeLabel } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './TicketCard.module.css'

export function TicketCard({ ticket, onSelect }: { ticket: Ticket; onSelect: () => void }) {
  const { t, locale } = useT()
  const { segment } = ticket
  const title = [segment.carrier, segment.number].filter(Boolean).join(' ')
  const arrival = clockTime(segment.arrivalTime)
  const extras = [
    segment.terminal && t('segments.terminalN', { terminal: segment.terminal }),
    segment.seat && t('segments.seatN', { seat: segment.seat }),
  ].filter(Boolean)

  return (
    <button
      type="button"
      className={styles.card}
      data-day-color={dayColorIndex(ticket.dayNumber)}
      onClick={onSelect}
    >
      <div className={styles.top}>
        <span className={styles.time}>{ticket.time ?? '--:--'}</span>
        <span className={styles.mode}>
          <TransportModeIcon mode={segment.mode} />
          {title || t(transportModeLabel[segment.mode])}
        </span>
      </div>

      <p className={styles.route}>
        {segment.departurePlace?.name ?? t('segments.fromUnknown')} →{' '}
        {segment.arrivalPlace?.name ?? t('segments.toUnknown')}
        {arrival && (
          <span className={styles.muted}> · {t('segments.arrivesAt', { time: arrival })}</span>
        )}
      </p>

      <p className={styles.meta}>
        <span className={styles.day}>{t('days.dayN', { n: ticket.dayNumber })}</span> ·{' '}
        {formatDayDate(ticket.date, locale)}
        {extras.length > 0 && ` · ${extras.join(' · ')}`}
      </p>

      <div className={styles.bottom}>
        {segment.bookingRef ? (
          <span className={styles.booking}>{segment.bookingRef}</span>
        ) : (
          <span className={styles.muted}>{t('segments.noBookingRef')}</span>
        )}
        <span className={styles.status} data-confirmed={segment.status === 'bekræftet'}>
          {segment.status === 'bekræftet' ? t('segments.confirmed') : t('segments.notConfirmed')}
        </span>
      </div>
    </button>
  )
}
