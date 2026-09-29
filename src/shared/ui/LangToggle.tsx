import { setLang } from '../i18n/lang'
import { useT } from '../i18n/useT'
import styles from './LangToggle.module.css'

/** Skifter mellem dansk og engelsk. Viser navnet på det sprog, man skifter til. */
export function LangToggle() {
  const { t, lang } = useT()
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={t('common.langToggleLabel')}
      onClick={() => setLang(lang === 'da' ? 'en' : 'da')}
    >
      {t('common.langToggle')}
    </button>
  )
}
