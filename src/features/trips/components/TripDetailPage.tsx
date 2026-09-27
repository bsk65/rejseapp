import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Tabs, type TabOption } from '../../../shared/ui/Tabs'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { DaysList } from '../../days/components/DaysList'
import { useDays } from '../../days/hooks/useDays'
import { PhotoGallery } from '../../photos/components/PhotoGallery'
import { PhotoUploadButton } from '../../photos/components/PhotoUploadButton'
import { usePhotos } from '../../photos/hooks/usePhotos'
import { TicketsView } from '../../segments/components/TicketsView'
import { formatDateRange } from '../logic/tripDates'
import { useTrip } from '../hooks/useTrip'
import { ShareTripDialog } from './ShareTripDialog'
import { TripMapTab } from './TripMapTab'
import styles from './TripDetailPage.module.css'

type TripTab = 'dage' | 'billetter' | 'kort'

const TABS: TabOption<TripTab>[] = [
  { id: 'dage', label: 'Dage' },
  { id: 'billetter', label: 'Billetter & tider' },
  { id: 'kort', label: 'Kort & spor' },
]

function isTripTab(value: string | null): value is TripTab {
  return TABS.some((tab) => tab.id === value)
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuthUser()
  const { trip, loading } = useTrip(tripId)
  const { days, loading: daysLoading } = useDays(tripId, user?.uid)
  const { photos } = usePhotos(tripId, user?.uid)
  const [searchParams, setSearchParams] = useSearchParams()
  const [highlightedDayId, setHighlightedDayId] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  // Valgt fane ligger i URL'en (?fane=...), så den overlever en genindlæsning.
  const tabParam = searchParams.get('fane')
  const activeTab: TripTab = isTripTab(tabParam) ? tabParam : 'dage'

  function selectTab(tab: TripTab) {
    setSearchParams(tab === 'dage' ? {} : { fane: tab }, { replace: true })
  }

  function showDay(dayId: string) {
    selectTab('dage')
    setHighlightedDayId(dayId)
    // Vent til fanen er vist, før der scrolles.
    requestAnimationFrame(() =>
      document.getElementById(`dag-${dayId}`)?.scrollIntoView({ behavior: 'smooth' }),
    )
  }

  if (loading) {
    return <p className={styles.status}>Henter rejsen…</p>
  }

  if (!trip || !user) {
    return (
      <div className={styles.page}>
        <p className={styles.status}>Rejsen findes ikke, eller du har ikke adgang til den.</p>
        <Link to="/">Tilbage til mine rejser</Link>
      </div>
    )
  }

  const isOwner = user.uid === trip.ownerUid
  const unsortedPhotos = photos.filter((p) => !p.dayId)

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Mine rejser
      </Link>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{trip.title}</h1>
          <p className={styles.meta}>{formatDateRange(trip.startDate, trip.days)}</p>
        </div>
        {isOwner && (
          <button
            type="button"
            className={styles.shareButton}
            onClick={() => setShowShareDialog(true)}
          >
            Del rejse
          </button>
        )}
      </div>

      {showShareDialog && (
        <ShareTripDialog
          tripId={trip.id}
          ownerUid={trip.ownerUid}
          memberUids={trip.memberUids}
          sharedCategories={trip.sharedCategories}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      <Tabs tabs={TABS} active={activeTab} onChange={selectTab} />

      {/* Alle faner forbliver monteret (kun skjult), så f.eks. en igangværende
          GPS-sporing på "Kort & spor" ikke stopper, når man skifter fane. */}
      <div className={styles.tabPanel} hidden={activeTab !== 'dage'}>
        <PhotoUploadButton
          tripId={trip.id}
          uploaderUid={user.uid}
          tripOwnerUid={trip.ownerUid}
          memberUids={trip.memberUids}
          sharePhotos={trip.sharedCategories.photos}
          days={days}
        />
        {unsortedPhotos.length > 0 && (
          <div>
            <p className={styles.sectionLabel}>Billeder uden dag</p>
            <PhotoGallery tripId={trip.id} photos={unsortedPhotos} />
          </div>
        )}
        <DaysList
          tripId={trip.id}
          memberUids={trip.memberUids}
          days={days}
          photos={photos}
          loading={daysLoading}
          highlightedDayId={highlightedDayId}
        />
      </div>

      <div className={styles.tabPanel} hidden={activeTab !== 'billetter'}>
        <TicketsView tripId={trip.id} days={days} userUid={user.uid} memberUids={trip.memberUids} />
      </div>

      <div className={styles.tabPanel} hidden={activeTab !== 'kort'}>
        <TripMapTab
          trip={trip}
          userUid={user.uid}
          days={days}
          photos={photos}
          onShowDay={showDay}
        />
      </div>
    </div>
  )
}
