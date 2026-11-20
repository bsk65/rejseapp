import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import type { Day } from '../../days/types'
import type { Reservation } from '../../reservations/types'
import type { Stay } from '../../stays/types'
import { useMarkGapOk } from '../hooks/useMarkGapOk'
import { useTripGaps } from '../hooks/useTripGaps'
import { gapKindIcon, gapKindLabel, isOkKind, type Gap } from '../types'
import { GapRow } from './GapRow'
import styles from './TripChecklist.module.css'

/**
 * "Mangler at booke": rejser, nætter og dage uden aktivitet, der mangler, samt
 * transport der ikke er bekræftet. Tryk på en linje går til dagen; huller kan
 * markeres "Det er OK" (gemmes på dagen) og fortrydes igen.
 */
export function TripChecklist({
  tripId,
  days,
  stays,
  reservations,
  userUid,
  onShowDay,
  onClose,
}: {
  tripId: string
  days: Day[]
  stays: Stay[]
  reservations: Reservation[]
  userUid: string
  onShowDay: (dayId: string) => void
  onClose: () => void
}) {
  const { t } = useT()
  const { groups, travelerUids } = useTripGaps(tripId, days, stays, reservations, userUid)
  const { setOk, error } = useMarkGapOk(tripId)
  const nothingAtAll = groups.every((group) => group.open.length === 0)

  function toggleOk(gap: Gap, ok: boolean) {
    const day = days.find((d) => d.id === gap.dayId)
    if (day && isOkKind(gap.kind)) void setOk(day, gap, ok)
  }

  return (
    <div className={styles.panel}>
      <p className={styles.title}>{t('checklist.title')}</p>
      <p className={styles.note}>{nothingAtAll ? t('checklist.allDone') : t('checklist.intro')}</p>
      {error && <p className={styles.error}>{t(error)}</p>}

      {groups.map((group) => (
        <section key={group.kind} className={styles.group}>
          <div className={styles.groupHeader}>
            <span>
              <span aria-hidden="true">{gapKindIcon[group.kind]}</span>{' '}
              {t(gapKindLabel[group.kind])}
            </span>
            <span className={styles.count} data-zero={group.open.length === 0}>
              {group.open.length}
            </span>
          </div>
          {group.open.length === 0 ? (
            <p className={styles.note}>{t('checklist.noneOpen')}</p>
          ) : (
            <>
              {group.kind === 'ubekraeftet' && (
                <p className={styles.note}>{t('checklist.unconfirmedHint')}</p>
              )}
              <ul className={styles.rows}>
                {group.open.map((gap) => (
                  <GapRow
                    key={gap.key}
                    gap={gap}
                    travelerUids={travelerUids}
                    onShowDay={onShowDay}
                    actionLabel={isOkKind(gap.kind) ? t('checklist.markOk') : undefined}
                    onAction={() => toggleOk(gap, true)}
                  />
                ))}
              </ul>
            </>
          )}
          {group.ok.length > 0 && (
            <>
              <p className={styles.okHeading}>{t('checklist.okHeading')}</p>
              <ul className={styles.rows}>
                {group.ok.map((gap) => (
                  <GapRow
                    key={gap.key}
                    gap={gap}
                    travelerUids={travelerUids}
                    muted
                    onShowDay={onShowDay}
                    actionLabel={t('checklist.undoOk')}
                    onAction={() => toggleOk(gap, false)}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      ))}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </div>
  )
}
