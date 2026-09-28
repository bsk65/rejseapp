import { useState } from 'react'
import { useAuthActions } from '../../auth/hooks/useAuthActions'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { Button } from '../../../shared/ui/Button'
import { AppQrButton } from '../../../shared/ui/AppQrButton'
import { PRIVACY_URL } from '../../auth/privacyVersion'
import { useTrips } from '../hooks/useTrips'
import { CreateTripForm } from './CreateTripForm'
import { TripList } from './TripList'
import styles from './TripsPage.module.css'

export function TripsPage() {
  const { user } = useAuthUser()
  const { logout } = useAuthActions()
  const { trips, loading } = useTrips(user?.uid ?? null)
  const [showForm, setShowForm] = useState(false)

  if (!user) return null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mine rejser</h1>
        <div className={styles.headerActions}>
          <button className={styles.logout} onClick={() => void logout()}>
            Log ud
          </button>
          <AppQrButton />
        </div>
      </header>

      {showForm ? (
        <CreateTripForm ownerUid={user.uid} onCreated={() => setShowForm(false)} />
      ) : (
        <Button onClick={() => setShowForm(true)}>Opret ny rejse</Button>
      )}

      <TripList trips={trips} loading={loading} />

      <a href={PRIVACY_URL} className={styles.policyLink} target="_blank" rel="noopener">
        Privatlivspolitik
      </a>
    </div>
  )
}
