import type { TextKey } from '../../shared/i18n/translator'
import type { Place } from '../../shared/types/place'

/** Et gemt billede af et boardingkort. Hver passager har sit eget (rejsefæller på samme fly). */
export type BoardingPassImage = {
  storagePath: string
  /** Som det står i stregkoden, f.eks. "KLAUSEN/BJARNE MR". */
  passengerName: string
  /** Hvem der gemte det (kun ejeren kan slette selve filen i Storage). */
  ownerUid: string
}

export type TransportMode = 'fly' | 'tog' | 'bil' | 'bus' | 'færge' | 'gang'
export type SegmentStatus = 'planlagt' | 'bekræftet'

export type Segment = {
  id: string
  mode: TransportMode
  status: SegmentStatus
  carrier?: string
  number?: string
  departurePlace?: Place
  departureTime?: string
  terminal?: string
  arrivalPlace?: Place
  arrivalTime?: string
  seat?: string
  bookingRef?: string
  freeText?: string
  boardingPasses?: BoardingPassImage[]
  /** Hvem der oprettede segmentet — kun informativ, ikke sikkerhedsrelevant. */
  ownerUid: string
  /** Denormaliseret fra rejsens memberUids — se CLAUDE.md. */
  memberUids: string[]
}

/** Felter en bruger kan redigere via detalje-formularen — ikke id/mode/ownerUid/memberUids. */
export type SegmentDetails = Omit<Segment, 'id' | 'mode' | 'ownerUid' | 'memberUids'>

/** Tekst-nøgle for transportformens navn — oversættes med t(). */
export const transportModeLabel: Record<TransportMode, TextKey> = {
  fly: 'segments.modeFly',
  tog: 'segments.modeTog',
  bil: 'segments.modeBil',
  bus: 'segments.modeBus',
  færge: 'segments.modeFaerge',
  gang: 'segments.modeGang',
}
