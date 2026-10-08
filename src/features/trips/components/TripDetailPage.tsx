import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { AppQrButton } from '../../../shared/ui/AppQrButton'
import { LangToggle } from '../../../shared/ui/LangToggle'
import { Tabs, type TabOption } from '../../../shared/ui/Tabs'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { TripCosts } from '../../costs/components/TripCosts'
import { DaysList } from '../../days/components/DaysList'
import { PeopleProvider } from '../../friends/components/PeopleProvider'
import { useDays } from '../../days/hooks/useDays'
import { PhotoGallery } from '../../photos/components/PhotoGallery'
import { PhotoUploadButton } from '../../photos/components/PhotoUploadButton'
import { usePhotos } from '../../photos/hooks/usePhotos'
import { OfflinePasses } from '../../segments/components/OfflinePasses'
import { TicketsView } from '../../segments/components/TicketsView'
import { useStays } from '../../stays/hooks/useStays'
import { useReservations } from '../../reservations/hooks/useReservations'
import { SummaryView } from '../../summary/components/SummaryView'
import { formatDateRange } from '../logic/tripDates'
import { useRemoveTripDay } from '../hooks/useRemoveTripDay'
import { useTrip } from '../hooks/useTrip'
import { DeleteTripButton } from './DeleteTripButton'
import { ExtendTripForm } from './ExtendTripForm'
import { ShareTripDialog } from './ShareTripDialog'
import { TripMapTab } from './TripMapTab'
import styles from './TripDetailPage.module.css'

type TripTab = 'dage' | 'billetter' | 'kort' | 'opsummering'

const TABS: { id: TripTab; labelKey: TextKey }[] = [
  { id: 'dage', labelKey: 'trips.tabDays' },
  { id: 'billetter', labelKey: 'trips.tabTickets' },
  { id: 'kort', labelKey: 'trips.tabMap' },
  { id: 'opsummering', labelKey: 'trips.tabPlay' },
]

function isTripTab(value: string | null): value is TripTab {
  return TABS.some((tab) => tab.id === value)
}

export function TripDetailPage() {
  const { t } = useT()
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuthUser()
  const { trip, loading } = useTrip(tripId)
  const { days, loading: daysLoading } = useDays(tripId, user?.uid)
  const { photos } = usePhotos(tripId, user?.uid)
  const { stays, error: staysError } = useStays(tripId, user?.uid)
  const { reservations, error: reservationsError } = useReservations(tripId, user?.uid)
  const [searchParams, setSearchParams] = useSearchParams()
  const [highlightedDayId, setHighlightedDayId] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showCosts, setShowCosts] = useState(false)
  const { removeDay, error: removeDayError } = useRemoveTripDay(trip, days, user?.uid)

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
    return <p className={styles.status}>{t('trips.loadingTrip')}</p>
  }

  if (!trip || !user) {
    return (
      <div className={styles.page}>
        <p className={styles.status}>{t('trips.notFound')}</p>
        <Link to="/">{t('common.backToTrips')}</Link>
      </div>
    )
  }

  const isOwner = user.uid === trip.ownerUid
  // Også billeder fra en dag, der er slettet (se removeTripDay).
  const dayIds = new Set(days.map((day) => day.id))
  const unsortedPhotos = photos.filter((p) => !p.dayId || (!daysLoading && !dayIds.has(p.dayId)))
  const tabs: TabOption<TripTab>[] = TABS.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))

  return (
    <PeopleProvider selfUid={user.uid} memberUids={trip.memberUids}>
      <OfflinePasses tripId={trip.id} days={days} userUid={user.uid} />
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link to="/" className={styles.back}>
            {t('trips.backMyTrips')}
          </Link>
          <div className={styles.topActions}>
            <LangToggle />
            <AppQrButton />
          </div>
        </div>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{trip.title}</h1>
            <p className={styles.meta}>{formatDateRange(trip.startDate, trip.days)}</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.shareButton}
              aria-label={t('costs.buttonLabel')}
              aria-expanded={showCosts}
              onClick={() => setShowCosts((prev) => !prev)}
            >
              <span aria-hidden="true">💰</span> {t('costs.button')}
            </button>
            {isOwner && (
              <button
                type="button"
                className={styles.shareButton}
                onClick={() => setShowShareDialog(true)}
              >
                {t('trips.shareTrip')}
              </button>
            )}
          </div>
        </div>

        {showCosts && (
          <TripCosts
            tripId={trip.id}
            days={days}
            stays={stays}
            reservations={reservations}
            userUid={user.uid}
            onClose={() => setShowCosts(false)}
          />
        )}

        {showShareDialog && (
          <ShareTripDialog
            tripId={trip.id}
            ownerUid={trip.ownerUid}
            memberUids={trip.memberUids}
            sharedCategories={trip.sharedCategories}
            onClose={() => setShowShareDialog(false)}
          />
        )}

        <Tabs tabs={tabs} active={activeTab} onChange={selectTab} />

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
              <p className={styles.sectionLabel}>{t('trips.photosWithoutDay')}</p>
              <PhotoGallery tripId={trip.id} photos={unsortedPhotos} />
            </div>
          )}
          {staysError && <p className={styles.error}>{t(staysError)}</p>}
          {reservationsError && <p className={styles.error}>{t(reservationsError)}</p>}
          <DaysList
            tripId={trip.id}
            memberUids={trip.memberUids}
            userUid={user.uid}
            stays={stays}
            reservations={reservations}
            days={days}
            photos={photos}
            loading={daysLoading}
            highlightedDayId={highlightedDayId}
            onDeleteDay={isOwner ? removeDay : undefined}
            deleteError={removeDayError}
          />
          {!daysLoading && <ExtendTripForm trip={trip} days={days} userUid={user.uid} />}
        </div>

        <div className={styles.tabPanel} hidden={activeTab !== 'billetter'}>
          <TicketsView
            tripId={trip.id}
            days={days}
            stays={stays}
            reservations={reservations}
            userUid={user.uid}
            memberUids={trip.memberUids}
          />
        </div>

        <div className={styles.tabPanel} hidden={activeTab !== 'kort'}>
          <TripMapTab
            trip={trip}
            userUid={user.uid}
            days={days}
            photos={photos}
            stays={stays}
            onShowDay={showDay}
          />
        </div>

        {/* Opsummeringen monteres kun, mens fanen er åben — der er intet at
          bevare, og animationen skal ikke køre i baggrunden. */}
        {activeTab === 'opsummering' && (
          <SummaryView
            tripId={trip.id}
            userUid={user.uid}
            dayCount={trip.days}
            days={days}
            photos={photos}
            stays={stays}
          />
        )}

        {isOwner && activeTab === 'dage' && (
          <DeleteTripButton
            tripId={trip.id}
            ownerUid={trip.ownerUid}
            title={trip.title}
            shared={trip.memberUids.length > 1}
          />
        )}
      </div>
    </PeopleProvider>
  )
}
