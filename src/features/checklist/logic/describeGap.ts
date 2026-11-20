import type { Translate } from '../../../shared/i18n/translator'
import { formatDayDate } from '../../../shared/utils/date'
import { describeSegment } from '../../segments/logic/describeSegment'
import type { Gap, GapPlace } from '../types'

/** Teksten på en linje i "Mangler": "Dag 3 · tirs. 12. maj" + hvad der mangler. */
export function describeGap(
  gap: Gap,
  t: Translate,
  locale: string,
): { title: string; detail: string } {
  const title = t('checklist.dayTitle', {
    day: t('days.dayN', { n: gap.dayNumber }),
    date: formatDayDate(gap.date, locale),
  })
  return { title, detail: gapDetail(gap, t) }
}

function gapDetail(gap: Gap, t: Translate): string {
  switch (gap.kind) {
    case 'overnatning':
      return t('checklist.noStay')
    case 'aktivitet':
      return t('checklist.noActivity')
    case 'ubekraeftet': {
      if (!gap.segment) return ''
      const { title, detail } = describeSegment(gap.segment, t)
      return `${title} · ${detail}`
    }
    case 'rejse': {
      const params = { from: placeName(gap.from, t), to: placeName(gap.to, t) }
      if (gap.reason === 'udrejse') return t('checklist.travelOut', params)
      if (gap.reason === 'hjemrejse') return t('checklist.travelHome', params)
      return t('checklist.travelBetween', params)
    }
  }
}

/** "Raja Ampat Dive Lodge (adresse mangler)" — så man ved, at en adresse kan fjerne hullet. */
function placeName(spot: GapPlace | undefined, t: Translate): string {
  if (!spot) return '?'
  return spot.place ? spot.name : t('checklist.noAddress', { name: spot.name })
}
