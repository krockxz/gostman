import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WebApp from './WebApp'
import { ErrorBoundary } from './components/ErrorBoundary'

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <WebApp />
    </ErrorBoundary>
  </React.StrictMode>
)
