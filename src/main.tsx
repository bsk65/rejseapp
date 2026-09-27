import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { registerServiceWorker } from './shared/pwa/registerServiceWorker'
import { reloadOnceForStaleChunk } from './shared/utils/staleChunk'

registerServiceWorker()

// Vite udsender denne hændelse, når en lazy-loadet fil ikke kan hentes —
// typisk fordi en ny version er deployet, mens den gamle stadig var åben.
// Genindlæs i stedet for at vise en fejl. Se shared/utils/staleChunk.ts.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForStaleChunk()) event.preventDefault()
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Rod-element #root findes ikke i index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
