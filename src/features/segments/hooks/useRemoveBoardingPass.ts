import { useState } from 'react'
import { removeBoardingPass } from '../repository'
import type { BoardingPassImage, Segment } from '../types'

/**
 * Flyets gemte boardingkort, som formularen viser — og fjernelse af dem.
 * Listen holdes lokalt, fordi formularens segment er et øjebliksbillede fra
 * da den blev åbnet (ellers ville to fjernelser i træk genskabe den første).
 */
export function useRemoveBoardingPass(tripId: string, dayId: string, segment: Segment) {
  const [passes, setPasses] = useState<BoardingPassImage[]>(segment.boardingPasses ?? [])

  async function remove(pass: BoardingPassImage): Promise<void> {
    const remaining = passes.filter((p) => p.storagePath !== pass.storagePath)
    await removeBoardingPass(tripId, dayId, segment.id, remaining, pass.storagePath)
    setPasses(remaining)
  }

  return { passes, remove }
}
