export type Friend = {
  uid: string
  email: string
}

/** En brugers offentlige profil (users/{uid}) — navnet vises for rejsefæller. */
export type Profile = {
  uid: string
  email: string
  /** Selvvalgt navn. Mangler det, vises første del af e-mailen. */
  displayName?: string
}
