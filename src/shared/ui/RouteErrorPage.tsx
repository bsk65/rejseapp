import { useEffect, useState } from 'react'
import { Link, useRouteError } from 'react-router-dom'
import {
  canReloadForStaleChunk,
  isStaleChunkError,
  reloadOnceForStaleChunk,
} from '../utils/staleChunk'
import { Button } from './Button'
import styles from './RouteErrorPage.module.css'

/** Vises i stedet for React Routers standard-fejlside. */
export function RouteErrorPage() {
  const error = useRouteError()
  const staleChunk = isStaleChunkError(error)
  // Besluttes én gang ved første visning, så genindlæsnings-vagten ikke
  // skifter svaret undervejs.
  const [reloading] = useState(() => staleChunk && canReloadForStaleChunk())

  useEffect(() => {
    if (reloading) reloadOnceForStaleChunk()
  }, [reloading])

  if (reloading) {
    return <p className={styles.status}>Henter den nyeste version af appen…</p>
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Noget gik galt</h1>
      <p className={styles.text}>
        {staleChunk
          ? 'Appen er blevet opdateret. Genindlæs siden for at hente den nye version.'
          : 'Der skete en uventet fejl. Prøv at genindlæse siden.'}
      </p>
      <Button type="button" onClick={() => window.location.reload()}>
        Genindlæs
      </Button>
      <Link to="/">Tilbage til mine rejser</Link>
    </div>
  )
}
