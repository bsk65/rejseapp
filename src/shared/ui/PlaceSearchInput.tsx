import { useEffect, useState } from 'react'
import { searchPlaces } from '../api/nominatim'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { Place } from '../types/place'
import { useT } from '../i18n/useT'
import { TextField } from './TextField'
import styles from './PlaceSearchInput.module.css'

export function PlaceSearchInput({
  label,
  onSelect,
}: {
  label?: string
  onSelect: (place: Place) => void
}) {
  const { t } = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebouncedValue(query, 400)

  const queryTooShort = debouncedQuery.trim().length < 2

  useEffect(() => {
    if (queryTooShort) return

    const controller = new AbortController()

    async function run() {
      setLoading(true)
      setError(null)
      try {
        setResults(await searchPlaces(debouncedQuery, controller.signal))
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(t('common.placeSearchError'))
      } finally {
        setLoading(false)
      }
    }
    void run()

    return () => controller.abort()
  }, [debouncedQuery, queryTooShort, t])

  function handleSelect(place: Place) {
    onSelect(place)
    setQuery('')
    setResults([])
  }

  return (
    <div className={styles.wrapper}>
      <TextField
        label={label ?? t('common.placeSearchLabel')}
        placeholder={t('common.placeSearchPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {!queryTooShort && loading && <p className={styles.hint}>{t('common.searching')}</p>}
      {!queryTooShort && error && <p className={styles.error}>{error}</p>}
      {!queryTooShort && results.length > 0 && (
        <ul className={styles.results}>
          {results.map((place) => (
            <li key={place.placeId}>
              <button
                type="button"
                className={styles.resultButton}
                onClick={() => handleSelect(place)}
              >
                <span className={styles.resultName}>{place.name}</span>
                {place.area && <span className={styles.resultArea}>{place.area}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
