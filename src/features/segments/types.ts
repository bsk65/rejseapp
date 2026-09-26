import type { Place } from '../../shared/types/place'

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
  arrivalPlace?: Place
  arrivalTime?: string
  bookingRef?: string
  freeText?: string
  ownerUid: string
}

export const transportModeLabel: Record<TransportMode, string> = {
  fly: 'Fly',
  tog: 'Tog',
  bil: 'Bil',
  bus: 'Bus',
  færge: 'Færge',
  gang: 'Gang',
}
