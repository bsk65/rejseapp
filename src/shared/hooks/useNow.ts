import { useEffect, useState } from 'react'

/** Det aktuelle tidspunkt, opdateret med et fast interval (til nedtællinger). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
