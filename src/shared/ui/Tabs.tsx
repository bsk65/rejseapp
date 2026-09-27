import styles from './Tabs.module.css'

export type TabOption<T extends string> = { id: T; label: string }

/** Fanebjælke. Selve fane-indholdet styres af den kaldende komponent. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabOption<T>[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
