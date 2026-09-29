import { useRef, type ChangeEvent } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import type { Day } from '../../days/types'
import { useUploadPhoto } from '../hooks/useUploadPhoto'
import styles from './PhotoUploadButton.module.css'

export function PhotoUploadButton({
  tripId,
  uploaderUid,
  tripOwnerUid,
  memberUids,
  sharePhotos,
  days,
}: {
  tripId: string
  uploaderUid: string
  tripOwnerUid: string
  memberUids: string[]
  sharePhotos: boolean
  days: Day[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useT()
  const { upload, pending, error } = useUploadPhoto()

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      await upload(tripId, uploaderUid, tripOwnerUid, memberUids, sharePhotos, days, file)
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        onChange={(e) => void handleChange(e)}
        disabled={pending}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? t('tracking.uploading') : t('tracking.addPhoto')}
      </Button>
      {error && <p className={styles.error}>{t(error)}</p>}
    </div>
  )
}
