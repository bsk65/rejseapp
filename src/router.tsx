import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './features/auth/components/RequireAuth'
import { TripsPage } from './features/trips/components/TripsPage'
import { RouteErrorPage } from './shared/ui/RouteErrorPage'

// MapLibre (via TripMap) er tung, så rejsedetalje-siden lazy-loades for at
// holde login/liste-bundlet lille på langsomme forbindelser.
// eslint-disable-next-line react-refresh/only-export-components -- router-fil, ikke en komponentfil
const TripDetailPage = lazy(() =>
  import('./features/trips/components/TripDetailPage').then((m) => ({
    default: m.TripDetailPage,
  })),
)

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    element: (
      <RequireAuth>
        <TripsPage />
      </RequireAuth>
    ),
  },
  {
    path: '/rejser/:tripId',
    errorElement: <RouteErrorPage />,
    element: (
      <RequireAuth>
        <Suspense fallback={null}>
          <TripDetailPage />
        </Suspense>
      </RequireAuth>
    ),
  },
])
