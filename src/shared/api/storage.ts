import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '../../firebase/config'

/** Download-URL for en fil i Firebase Storage (billeder, boardingkort). */
export function getStorageUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(storage, storagePath))
}
