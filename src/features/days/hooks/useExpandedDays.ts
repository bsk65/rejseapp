import { useState } from 'react'
import { initiallyExpandedDayIds } from '../logic/daySummary'
import type { Day } from '../types'

/**
 * Hvilke dage der er foldet ud. Starter med dagen med dags dato (`today`) (når dagene
 * er hentet), og en dag, der vises fra kortet (`highlightedDayId`), foldes
 * automatisk ud.
 */
export function useExpandedDays(days: Day[], highlightedDayId: string | null, today: string) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)
  const [lastHighlighted, setLastHighlighted] = useState<string | null>(null)

  // Justering under render (React-mønster for "state afledt af props") i
  // stedet for en effekt — så dagen er foldet ud allerede i første visning.
  if (!initialized && days.length > 0) {
    setInitialized(true)
    setExpanded(new Set(initiallyExpandedDayIds(days, today)))
  }
  if (highlightedDayId !== lastHighlighted) {
    setLastHighlighted(highlightedDayId)
    if (highlightedDayId) setExpanded((prev) => new Set(prev).add(highlightedDayId))
  }

  function toggle(dayId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(dayId)) next.delete(dayId)
      else next.add(dayId)
      return next
    })
  }

  const allExpanded = days.length > 0 && days.every((day) => expanded.has(day.id))
  const noneExpanded = !days.some((day) => expanded.has(day.id))

  return {
    isExpanded: (dayId: string) => expanded.has(dayId),
    toggle,
    allExpanded,
    noneExpanded,
    expandAll: () => setExpanded(new Set(days.map((day) => day.id))),
    collapseAll: () => setExpanded(new Set()),
  }
}
