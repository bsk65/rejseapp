/**
 * Hvem der må se et delings-styret dokument (billede, sporingspunkt) lige nu.
 * Trippens ejer og den der oprettede dokumentet kan altid se det selv;
 * øvrige medlemmer kun hvis trippen deler den pågældende kategori
 * (sharedCategories.photos / .track). Se CLAUDE.md.
 */
export function computeViewerUids(
  shared: boolean,
  memberUids: string[],
  tripOwnerUid: string,
  creatorUid: string,
): string[] {
  if (shared) {
    return memberUids
  }
  return Array.from(new Set([tripOwnerUid, creatorUid]))
}
