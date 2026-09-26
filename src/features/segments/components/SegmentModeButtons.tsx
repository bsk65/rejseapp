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
  return (
    <div className={styles.row}>
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          className={styles.button}
          disabled={disabled}
          onClick={() => onAdd(mode)}
          aria-label={`Tilføj ${transportModeLabel[mode].toLowerCase()}`}
        >
          <TransportModeIcon mode={mode} />
        </button>
      ))}
    </div>
  )
}
