import { deleteTrackPoint } from '../repository'

export function useDeleteTrackPoint() {
  async function remove(tripId: string, pointId: string): Promise<void> {
    await deleteTrackPoint(tripId, pointId)
  }

  return { remove }
}
