import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'

// Old email links were built with a trailing slash in CLIENT_URL, producing
// paths like "//verify-email". React Router won't match those, so collapse
// duplicate slashes before the router reads the location.
const rawPath = window.location.pathname
if (/\/{2,}/.test(rawPath)) {
  window.history.replaceState(
    null,
    '',
    rawPath.replace(/\/{2,}/g, '/') + window.location.search + window.location.hash
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
