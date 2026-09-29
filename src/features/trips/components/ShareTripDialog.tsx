import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useAddFriendByEmail } from '../../friends/hooks/useAddFriendByEmail'
import { useFriends } from '../../friends/hooks/useFriends'
import { useUpdateSharedCategories } from '../hooks/useUpdateSharedCategories'
import { useUpdateTripMembers } from '../hooks/useUpdateTripMembers'
import type { SharedCategories } from '../types'
import styles from './ShareTripDialog.module.css'

export function ShareTripDialog({
  tripId,
  ownerUid,
  memberUids,
  sharedCategories,
  onClose,
}: {
  tripId: string
  ownerUid: string
  memberUids: string[]
  sharedCategories: SharedCategories
  onClose: () => void
}) {
  const { t } = useT()
  const { friends } = useFriends(ownerUid)
  const { addByEmail, pending: addingFriend, error: addError } = useAddFriendByEmail(ownerUid)
  const { saveMembers, pending: savingMembers } = useUpdateTripMembers()
  const { saveSharedCategories, pending: savingCategories } = useUpdateSharedCategories()
  const [selected, setSelected] = useState<Set<string>>(new Set(memberUids))
  const [sharePhotos, setSharePhotos] = useState(sharedCategories.photos)
  const [shareTrack, setShareTrack] = useState(sharedCategories.track)
  const [email, setEmail] = useState('')
  const saving = savingMembers || savingCategories

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) {
        next.delete(uid)
      } else {
        next.add(uid)
      }
      return next
    })
  }

  async function handleAddFriend() {
    const ok = await addByEmail(email)
    if (ok) {
      setEmail('')
    }
  }

  async function handleSave() {
    const nextMemberUids = Array.from(selected)
    await saveMembers(tripId, ownerUid, nextMemberUids)
    // Køres altid (ikke kun ved ændret toggle): billeder og sporingspunkter
    // har deres eget adgangsfelt, som også skal genberegnes når medlemslisten
    // ændres — ellers ser nye medlemmer ikke det allerede delte indhold.
    await saveSharedCategories(tripId, ownerUid, nextMemberUids, {
      photos: sharePhotos,
      track: shareTrack,
    })
    onClose()
  }

  return (
    <div className={styles.dialog}>
      <p className={styles.title}>{t('trips.shareWith')}</p>

      {friends.length === 0 ? (
        <p className={styles.empty}>{t('trips.noFriends')}</p>
      ) : (
        <ul className={styles.list}>
          {friends.map((friend) => (
            <li key={friend.uid}>
              <label className={styles.friendRow}>
                <input
                  type="checkbox"
                  checked={selected.has(friend.uid)}
                  onChange={() => toggle(friend.uid)}
                />
                {friend.email}
              </label>
            </li>
          ))}
        </ul>
      )}

      <label className={styles.friendRow}>
        <input
          type="checkbox"
          checked={sharePhotos}
          onChange={(e) => setSharePhotos(e.target.checked)}
        />
        {t('trips.sharePhotos')}
      </label>

      <label className={styles.friendRow}>
        <input
          type="checkbox"
          checked={shareTrack}
          onChange={(e) => setShareTrack(e.target.checked)}
        />
        {t('trips.shareTrack')}
      </label>

      <div className={styles.addFriend}>
        <TextField
          label={t('trips.addFriendEmail')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {addError && <p className={styles.error}>{t(addError)}</p>}
        <Button
          type="button"
          variant="secondary"
          disabled={addingFriend}
          onClick={() => void handleAddFriend()}
        >
          {t('trips.addFriend')}
        </Button>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          {t('trips.saveSharing')}
        </Button>
      </div>
    </div>
  )
}
