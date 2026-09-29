import { useState } from 'react'
import { useAuthActions } from '../../auth/hooks/useAuthActions'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { Button } from '../../../shared/ui/Button'
import { AppQrButton } from '../../../shared/ui/AppQrButton'
import { Tabs, type TabOption } from '../../../shared/ui/Tabs'
import { useNow } from '../../../shared/hooks/useNow'
import { localIsoDate } from '../../../shared/utils/date'
import { PRIVACY_URL } from '../../auth/privacyVersion'
import { useTrips } from '../hooks/useTrips'
import { splitTripsByArchive } from '../logic/tripArchive'
import { CreateTripForm } from './CreateTripForm'
import { TripList } from './TripList'
import styles from './TripsPage.module.css'

type TripsTab = 'aktuelle' | 'arkiv'

export function TripsPage() {
  const { user } = useAuthUser()
  const { logout } = useAuthActions()
  const { trips, loading } = useTrips(user?.uid ?? null)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<TripsTab>('aktuelle')
  const today = localIsoDate(useNow().getTime())

  if (!user) return null

  // Overståede rejser flyttes automatisk til Arkiv dagen efter sidste rejsedag.
  const { current, archived } = splitTripsByArchive(trips, today)
  const tabs: TabOption<TripsTab>[] = [
    { id: 'aktuelle', label: 'Rejser' },
    { id: 'arkiv', label: archived.length > 0 ? `Arkiv (${archived.length})` : 'Arkiv' },
  ]

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

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'aktuelle' ? (
        <TripList
          trips={current}
          loading={loading}
          emptyText={
            archived.length > 0
              ? 'Ingen kommende rejser. Overståede rejser ligger i Arkiv.'
              : 'Du har ikke oprettet nogen rejser endnu.'
          }
        />
      ) : (
        <TripList
          trips={archived}
          loading={loading}
          emptyText="Overståede rejser havner her automatisk dagen efter sidste rejsedag."
        />
      )}

      <a href={PRIVACY_URL} className={styles.policyLink} target="_blank" rel="noopener">
        Privatlivspolitik
      </a>
    </div>
  )
}
