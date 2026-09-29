import { useT } from '../../../shared/i18n/useT'
import { transportModeLabel, type TransportMode } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './SegmentModeButtons.module.css'

const modes: TransportMode[] = ['fly', 'tog', 'bil', 'bus', 'færge', 'gang']

export function SegmentModeButtons({
  onAdd,
  disabled,
}: {
  onAdd: (mode: TransportMode) => void
  disabled?: boolean
}) {
  const { t } = useT()
  return (
    <div className={styles.row}>
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          className={styles.button}
          disabled={disabled}
          onClick={() => onAdd(mode)}
          aria-label={t('segments.addMode', { mode: t(transportModeLabel[mode]).toLowerCase() })}
        >
          <TransportModeIcon mode={mode} />
        </button>
      ))}
    </div>
  )
}
