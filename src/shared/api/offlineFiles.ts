import { getStorageUrl } from './storage'

/**
 * Kopier af vigtige filer (boardingkort, billetter) på enheden, så de kan
 * vises uden forbindelse. Ligger i browserens Cache Storage under appens egen
 * adresse — nøglen er filens storagePath, ikke download-URL'en (den kræver
 * forbindelse at slå op).
 */
const CACHE_NAME = 'rejseappen-offline-filer'

function cacheKey(storagePath: string): string {
  return `/offline-filer/${encodeURIComponent(storagePath)}`
}

function cacheAvailable(): boolean {
  return typeof caches !== 'undefined'
}

/** Henter filen og gemmer en kopi — gør intet, hvis den allerede er gemt. */
export async function saveFileOffline(storagePath: string): Promise<void> {
  if (!cacheAvailable()) return
  const cache = await caches.open(CACHE_NAME)
  if (await cache.match(cacheKey(storagePath))) return
  const response = await fetch(await getStorageUrl(storagePath))
  if (response.ok) await cache.put(cacheKey(storagePath), response)
}

/** Den gemte kopi som lokal blob-URL — null, hvis den ikke er gemt. */
export async function offlineFileUrl(storagePath: string): Promise<string | null> {
  if (!cacheAvailable()) return null
  const cache = await caches.open(CACHE_NAME)
  const response = await cache.match(cacheKey(storagePath))
  return response ? URL.createObjectURL(await response.blob()) : null
}

/** Fjerner kopien (når filen er slettet). */
export async function removeOfflineFile(storagePath: string): Promise<void> {
  if (!cacheAvailable()) return
  const cache = await caches.open(CACHE_NAME)
  await cache.delete(cacheKey(storagePath))
}
