import type { Stay } from '../types'

/** Antal nætter mellem to ISO-datoer (YYYY-MM-DD), uafhængigt af tidszone. */
export function nightCount(checkInDate: string, checkOutDate: string): number {
  const ms = Date.parse(`${checkOutDate}T00:00:00Z`) - Date.parse(`${checkInDate}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

/** Fejltekst til formularen, eller null hvis datoerne er i orden. */
export function validateStayDates(checkInDate: string, checkOutDate: string): string | null {
  if (!checkInDate || !checkOutDate) return 'Vælg både indtjeknings- og udtjekningsdato.'
  if (nightCount(checkInDate, checkOutDate) < 1) return 'Udtjekning skal være efter indtjekning.'
  return null
}

/** Hvad der sker med en overnatning på en given dag. */
export type StayEventKind = 'udtjek' | 'nat' | 'indtjek'

export type DayStayEvent = { stay: Stay; kind: StayEventKind }

const EVENT_ORDER: Record<StayEventKind, number> = { udtjek: 0, nat: 1, indtjek: 2 }

/**
 * Overnatningerne for én dag: udtjekning om morgenen, en nat der fortsætter,
 * eller indtjekning (som også er nattens overnatning). Samme dag kan have
 * både udtjek fra ét sted og indtjek et andet.
 */
export function stayEventsForDate(stays: Stay[], date: string): DayStayEvent[] {
  const events: DayStayEvent[] = []
  stays.forEach((stay) => {
    if (stay.checkOutDate === date) events.push({ stay, kind: 'udtjek' })
    else if (stay.checkInDate === date) events.push({ stay, kind: 'indtjek' })
    else if (stay.checkInDate < date && date < stay.checkOutDate) events.push({ stay, kind: 'nat' })
  })
  return events.sort((a, b) => EVENT_ORDER[a.kind] - EVENT_ORDER[b.kind])
}

/** Ind- eller udtjekning som et tidspunkt i rejsens tidsliste. */
export type StayMoment = {
  stay: Stay
  kind: 'indtjek' | 'udtjek'
  date: string
  time?: string
  /** YYYY-MM-DDTHH:mm, hvis klokkeslættet kendes. */
  at?: string
}

export function stayMoments(stays: Stay[]): StayMoment[] {
  return stays.flatMap((stay) => {
    const moment = (kind: StayMoment['kind'], date: string, time?: string): StayMoment => ({
      stay,
      kind,
      date,
      time,
      at: time ? `${date}T${time}` : undefined,
    })
    return [
      moment('indtjek', stay.checkInDate, stay.checkInTime),
      moment('udtjek', stay.checkOutDate, stay.checkOutTime),
    ]
  })
}
