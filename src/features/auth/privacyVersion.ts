/**
 * Den gældende privatlivspolitiks version — SKAL matche "Sidst opdateret" i
 * public/privatliv.html. Ændres politikken væsentligt, opdateres begge, og
 * alle brugere (nye som eksisterende) bliver bedt om at acceptere igen
 * (PrivacyGate i RequireAuth). Samme model som i søsterprojektet "3D bueskydning".
 */
export const PRIVACY_VERSION = '2026-10-08'

export const PRIVACY_URL = '/privatliv.html'

export function hasAcceptedCurrentPolicy(acceptedVersion: string | null | undefined): boolean {
  return acceptedVersion === PRIVACY_VERSION
}

/** Engelsk udgave af politikken — samme indhold og version som den danske. */
export const PRIVACY_URL_EN = '/privacy.html'
