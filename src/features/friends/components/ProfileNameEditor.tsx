import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useProfiles } from '../hooks/useProfiles'
import { useUpdateDisplayName } from '../hooks/useUpdateDisplayName'
import styles from './ProfileNameEditor.module.css'

/**
 * Ens eget navn på forsiden — vises for rejsefæller (f.eks. hvem der er med
 * på et fly). Uden navn vises første del af e-mailen.
 */
export function ProfileNameEditor({ uid }: { uid: string }) {
  const { t } = useT()
  const profile = useProfiles([uid])[uid]
  const { save, pending, failed } = useUpdateDisplayName()
  const [draft, setDraft] = useState<string | null>(null)
  const name = profile?.displayName?.trim()

  // Profilen er ikke hentet endnu — vis intet frem for et forkert "Tilføj".
  if (!profile) return null

  async function handleSave() {
    if (draft !== null && (await save(uid, draft))) setDraft(null)
  }

  if (draft === null) {
    return (
      <div className={styles.row}>
        <span className={name ? styles.name : styles.missing}>
          {name ? t('people.nameShown', { name }) : t('people.nameHint')}
        </span>
        <button type="button" className={styles.linkButton} onClick={() => setDraft(name ?? '')}>
          {name ? t('people.editName') : t('people.addName')}
        </button>
      </div>
    )
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        void handleSave()
      }}
    >
      <TextField
        id="profile-name"
        label={t('people.yourName')}
        value={draft}
        autoComplete="name"
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      <p className={styles.hint}>{t('people.nameHint')}</p>
      {failed && <p className={styles.error}>{t('people.nameSaveError')}</p>}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={() => setDraft(null)}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={pending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
