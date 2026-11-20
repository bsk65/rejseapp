import type { Translate } from '../../../shared/i18n/translator'
import { formatDayDate } from '../../../shared/utils/date'
import { describeSegment } from '../../segments/logic/describeSegment'
import type { Gap } from '../types'

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
      const params = { from: gap.from?.name ?? '?', to: gap.to?.name ?? '?' }
      if (gap.reason === 'udrejse') return t('checklist.travelOut', params)
      if (gap.reason === 'hjemrejse') return t('checklist.travelHome', params)
      return t('checklist.travelBetween', params)
    }
  }
}
