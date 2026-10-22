import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNow } from '../../../shared/hooks/useNow'
import { useT } from '../../../shared/i18n/useT'
import { clockTime, formatDayDate, localIsoDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import type { Day } from '../../days/types'
import { ReservationForm } from '../../reservations/components/ReservationForm'
import { reservationKindIcon } from '../../reservations/types'
import { SegmentDetailForm } from '../../segments/components/SegmentDetailForm'
import { TransportModeIcon } from '../../segments/components/TransportModeIcon'
import { useTripSegments } from '../../segments/hooks/useTripSegments'
import { transportModeLabel } from '../../segments/types'
import { BedIcon } from '../../stays/components/BedIcon'
import { StayForm } from '../../stays/components/StayForm'
import type { Stay } from '../../stays/types'
import type { Reservation } from '../../reservations/types'
import {
  buildCalendarDays,
  stayBars,
  visibleHours,
  type CalendarSource,
} from '../logic/calendarLayout'
import { cssVars } from './cssVars'
import styles from './CalendarView.module.css'

/** Antal dage ad gangen — færre dage = større felter ("forstør"). */
const ZOOM_LEVELS = [1, 3, 7] as const
type DaysShown = (typeof ZOOM_LEVELS)[number]

/** Det, der er åbnet i formularen under kalenderen. */
type Editing = { key: string } & (CalendarSource | { kind: 'stay'; stay: Stay })

/**
 * Dage-fanen som tidsplan: dagene side om side, klokkeslæt nedad, overnatninger
 * som bjælker øverst. Tryk på et punkt åbner det i sin formular.
 */
export function CalendarView({
  tripId,
  days,
  stays,
  reservations,
  userUid,
  memberUids,
  onShowDay,
}: {
  tripId: string
  days: Day[]
  stays: Stay[]
  reservations: Reservation[]
  userUid: string
  memberUids: string[]
  /** Skift til listen med den dag foldet ud. */
  onShowDay: (dayId: string) => void
}) {
  const { t, locale } = useT()
  const now = useNow()
  const today = localIsoDate(now.getTime())
  const { entries } = useTripSegments(tripId, days, userUid)
  const [daysShown, setDaysShown] = useState<DaysShown>(3)
  // Start på dags dato, hvis rejsen er i gang.
  const [start, setStart] = useState(() =>
    Math.max(
      0,
      days.findIndex((d) => d.date === today),
    ),
  )
  const [editing, setEditing] = useState<Editing | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const calendarDays = useMemo(
    () => buildCalendarDays(entries, reservations),
    [entries, reservations],
  )
  const hours = visibleHours(calendarDays)
  const hourList = Array.from({ length: hours.last - hours.first }, (_, i) => hours.first + i)

  const first = Math.min(start, Math.max(0, days.length - daysShown))
  const shownDays = days.slice(first, first + daysShown)
  const dates = shownDays.map((day) => day.date)
  const bars = stayBars(stays, dates)
  const hasUntimed = dates.some((date) => (calendarDays.get(date)?.untimed.length ?? 0) > 0)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  useEffect(() => {
    if (editing) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [editing])

  if (days.length === 0) return null

  const zoomIndex = ZOOM_LEVELS.indexOf(daysShown)
  const zoom = (step: number) => {
    const next = ZOOM_LEVELS[zoomIndex + step]
    if (next) setDaysShown(next)
  }
  const page = (step: number) =>
    setStart(Math.min(Math.max(0, first + step * daysShown), Math.max(0, days.length - daysShown)))

  function label(source: CalendarSource): { icon: ReactNode; title: string; detail?: string } {
    if (source.kind === 'reservation') {
      const { reservation } = source
      return { icon: reservationKindIcon[reservation.kind], title: reservation.name }
    }
    const { segment } = source.entry
    const title =
      [segment.carrier?.trim(), segment.number].filter(Boolean).join(' ') ||
      t(transportModeLabel[segment.mode])
    const from = segment.departurePlace?.name
    const to = segment.arrivalPlace?.name
    return {
      icon: <TransportModeIcon mode={segment.mode} />,
      title,
      detail: from || to ? `${from ?? '?'} → ${to ?? '?'}` : undefined,
    }
  }

  function timeLabel(source: CalendarSource, continued: boolean): string | undefined {
    if (source.kind === 'reservation') return source.reservation.time
    const departs = clockTime(source.entry.segment.departureTime)
    const arrives = clockTime(source.entry.segment.arrivalTime)
    if (continued) return arrives && `→ ${arrives}`
    return [departs, arrives].filter(Boolean).join('–')
  }

  const open = (key: string, source: Editing) =>
    setEditing((prev) => (prev?.key === key ? null : source))

  return (
    <div className={styles.calendar} data-days={daysShown}>
      <div className={styles.toolbar}>
        <div className={styles.group}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => zoom(1)}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            aria-label={t('calendar.zoomOut')}
          >
            −
          </button>
          <span className={styles.zoomLabel}>
            {daysShown === 1 ? t('calendar.oneDay') : t('calendar.nDays', { n: daysShown })}
          </span>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => zoom(-1)}
            disabled={zoomIndex === 0}
            aria-label={t('calendar.zoomIn')}
          >
            +
          </button>
        </div>
        <div className={styles.group}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => page(-1)}
            disabled={first === 0}
            aria-label={t('calendar.previous')}
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => page(1)}
            disabled={first + daysShown >= days.length}
            aria-label={t('calendar.next')}
          >
            ›
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <span className={styles.corner} />
        {shownDays.map((day) => (
          <button
            key={day.id}
            type="button"
            className={styles.dayHeader}
            data-day-color={dayColorIndex(day.dayNumber)}
            data-today={day.date === today}
            onClick={() => onShowDay(day.id)}
            aria-label={t('calendar.showDay', { n: day.dayNumber })}
          >
            <span className={styles.dayNumber}>{t('days.dayN', { n: day.dayNumber })}</span>
            <span className={styles.dayDate}>{formatDayDate(day.date, locale)}</span>
          </button>
        ))}

        {bars.length > 0 && (
          <>
            <span className={styles.rowIcon}>
              <BedIcon />
            </span>
            <div className={styles.stays}>
              {bars.map((bar) => {
                const key = `stay:${bar.stay.id}`
                return (
                  <button
                    key={key}
                    type="button"
                    ref={cssVars({
                      'col-start': bar.startColumn + 1,
                      'col-end': bar.endColumn + 2,
                      row: bar.row + 1,
                    })}
                    className={styles.stayBar}
                    data-starts-before={bar.startsBefore}
                    data-ends-after={bar.endsAfter}
                    data-open={editing?.key === key}
                    onClick={() => open(key, { key, kind: 'stay', stay: bar.stay })}
                  >
                    {bar.stay.name}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {hasUntimed && (
          <>
            <span className={styles.rowLabel}>{t('calendar.noTime')}</span>
            {shownDays.map((day) => (
              <div key={day.id} className={styles.untimed}>
                {(calendarDays.get(day.date)?.untimed ?? []).map(({ key, source }) => {
                  const { icon, title } = label(source)
                  return (
                    <button
                      key={key}
                      type="button"
                      className={styles.event}
                      data-kind={source.kind}
                      data-day-color={dayColorIndex(day.dayNumber)}
                      data-open={editing?.key === key}
                      onClick={() => open(key, { key, ...source })}
                    >
                      <span className={styles.eventLine}>
                        <span className={styles.icon}>{icon}</span>
                        <span className={styles.eventTitle}>{title}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </>
        )}

        <div className={styles.hours} ref={cssVars({ hours: hourList.length })}>
          {hourList.map((hour) => (
            <span key={hour} className={styles.hour}>
              {String(hour).padStart(2, '0')}
            </span>
          ))}
        </div>
        {shownDays.map((day) => (
          <div
            key={day.id}
            className={styles.column}
            ref={cssVars({ hours: hourList.length })}
            data-day-color={dayColorIndex(day.dayNumber)}
          >
            {(calendarDays.get(day.date)?.timed ?? []).map((event) => {
              const { icon, title, detail } = label(event.source)
              const itemKey =
                event.source.kind === 'segment'
                  ? `segment:${event.source.entry.segment.id}`
                  : `reservation:${event.source.reservation.id}`
              return (
                <button
                  key={event.key}
                  type="button"
                  ref={cssVars({
                    start: event.start - hours.first * 60,
                    length: event.end - event.start,
                    lane: event.lane,
                    lanes: event.lanes,
                  })}
                  className={styles.timedEvent}
                  data-kind={event.source.kind}
                  data-continued={event.continued}
                  data-open={editing?.key === itemKey}
                  onClick={() => open(itemKey, { key: itemKey, ...event.source })}
                >
                  <span className={styles.eventLine}>
                    <span className={styles.icon}>{icon}</span>
                    <span className={styles.eventTime}>
                      {timeLabel(event.source, event.continued)}
                    </span>
                  </span>
                  <span className={styles.eventTitle}>{title}</span>
                  {detail && <span className={styles.eventDetail}>{detail}</span>}
                </button>
              )
            })}
            {day.date === today &&
              nowMinutes >= hours.first * 60 &&
              nowMinutes < hours.last * 60 && (
                <span
                  className={styles.now}
                  ref={cssVars({ start: nowMinutes - hours.first * 60 })}
                  aria-hidden="true"
                />
              )}
          </div>
        ))}
      </div>

      {editing && (
        <div ref={formRef} className={styles.form}>
          {editing.kind === 'segment' && (
            <SegmentDetailForm
              key={editing.key}
              tripId={tripId}
              dayId={editing.entry.dayId}
              dayDate={editing.entry.dayDate}
              segment={editing.entry.segment}
              onClose={() => setEditing(null)}
            />
          )}
          {editing.kind === 'reservation' && (
            <ReservationForm
              key={editing.key}
              tripId={tripId}
              userUid={userUid}
              memberUids={memberUids}
              reservation={editing.reservation}
              onClose={() => setEditing(null)}
            />
          )}
          {editing.kind === 'stay' && (
            <StayForm
              key={editing.key}
              tripId={tripId}
              userUid={userUid}
              memberUids={memberUids}
              stay={editing.stay}
              onClose={() => setEditing(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
