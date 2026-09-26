/**
 * Hvem der må se et billede lige nu. Ejeren og den der uploadede billedet kan
 * altid se det selv; øvrige medlemmer kun hvis trippen deler billeder.
 */
export function computePhotoViewerUids(
  sharePhotos: boolean,
  memberUids: string[],
  tripOwnerUid: string,
  uploaderUid: string,
): string[] {
  if (sharePhotos) {
    return memberUids
  }
  return Array.from(new Set([tripOwnerUid, uploaderUid]))
}
