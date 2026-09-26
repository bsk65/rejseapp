import { removeFriend } from '../repository'

export function useRemoveFriend() {
  async function remove(ownerUid: string, friendUid: string): Promise<void> {
    await removeFriend(ownerUid, friendUid)
  }

  return { remove }
}
