import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { LangToggle } from '../../../shared/ui/LangToggle'
import { usePrivacyUrl } from '../../auth/hooks/usePrivacyUrl'
import { useAuthActions } from '../../auth/hooks/useAuthActions'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { Button } from '../../../shared/ui/Button'
import { AppQrButton } from '../../../shared/ui/AppQrButton'
import { AppVersion } from '../../../shared/ui/AppVersion'
import { Tabs, type TabOption } from '../../../shared/ui/Tabs'
import { useNow } from '../../../shared/hooks/useNow'
import { localIsoDate } from '../../../shared/utils/date'

import { useTrips } from '../hooks/useTrips'
import { splitTripsByArchive } from '../logic/tripArchive'
import { CreateTripForm } from './CreateTripForm'
import { TripList } from './TripList'
import styles from './TripsPage.module.css'

type TripsTab = 'aktuelle' | 'arkiv'

export function TripsPage() {
  const { t } = useT()
  const privacyUrl = usePrivacyUrl()
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
    { id: 'aktuelle', label: t('trips.tabCurrent') },
    {
      id: 'arkiv',
      label:
        archived.length > 0
          ? t('trips.tabArchiveCount', { count: archived.length })
          : t('trips.tabArchive'),
    },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('trips.myTrips')}</h1>
        <div className={styles.headerActions}>
          <LangToggle />
          <button className={styles.logout} onClick={() => void logout()}>
            {t('auth.logout')}
          </button>
          <AppQrButton />
        </div>
      </header>

      {showForm ? (
        <CreateTripForm ownerUid={user.uid} onCreated={() => setShowForm(false)} />
      ) : (
        <Button onClick={() => setShowForm(true)}>{t('trips.newTrip')}</Button>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'aktuelle' ? (
        <TripList
          trips={current}
          loading={loading}
          emptyText={archived.length > 0 ? t('trips.emptyCurrent') : t('trips.emptyNone')}
        />
      ) : (
        <TripList trips={archived} loading={loading} emptyText={t('trips.emptyArchive')} />
      )}

      <a href={privacyUrl} className={styles.policyLink} target="_blank" rel="noopener">
        {t('auth.privacyPolicy')}
      </a>
      <AppVersion />
    </div>
  )
}
