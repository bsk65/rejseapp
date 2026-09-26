import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useAddFriendByEmail } from '../../friends/hooks/useAddFriendByEmail'
import { useFriends } from '../../friends/hooks/useFriends'
import { useUpdateTripMembers } from '../hooks/useUpdateTripMembers'
import styles from './ShareTripDialog.module.css'

export function ShareTripDialog({
  tripId,
  ownerUid,
  memberUids,
  onClose,
}: {
  tripId: string
  ownerUid: string
  memberUids: string[]
  onClose: () => void
}) {
  const { friends } = useFriends(ownerUid)
  const { addByEmail, pending: addingFriend, error: addError } = useAddFriendByEmail(ownerUid)
  const { saveMembers, pending: saving } = useUpdateTripMembers()
  const [selected, setSelected] = useState<Set<string>>(new Set(memberUids))
  const [email, setEmail] = useState('')

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
    await saveMembers(tripId, ownerUid, Array.from(selected))
    onClose()
  }

  return (
    <div className={styles.dialog}>
      <p className={styles.title}>Del rejse med</p>

      {friends.length === 0 ? (
        <p className={styles.empty}>Du har ingen venner tilføjet endnu.</p>
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

      <div className={styles.addFriend}>
        <TextField
          label="Tilføj ven via e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {addError && <p className={styles.error}>{addError}</p>}
        <Button
          type="button"
          variant="secondary"
          disabled={addingFriend}
          onClick={() => void handleAddFriend()}
        >
          Tilføj ven
        </Button>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Annuller
        </Button>
        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          Gem deling
        </Button>
      </div>
    </div>
  )
}
