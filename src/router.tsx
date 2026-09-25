import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './features/auth/components/RequireAuth'
import { TripsPage } from './features/trips/components/TripsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <TripsPage />
      </RequireAuth>
    ),
  },
])
