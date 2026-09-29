import type { Profile } from '../types'

/**
 * Navnet, en person vises med: det valgte navn, ellers første del af
 * e-mailen ("lars.hansen" for lars.hansen@example.com). `undefined`, hvis
 * profilen ikke er hentet (endnu).
 */
export function displayNameOf(profile: Profile | undefined): string | undefined {
  const name = profile?.displayName?.trim()
  if (name) return name
  return profile?.email.split('@')[0] || undefined
}
