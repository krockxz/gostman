import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WebApp from './WebApp'

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
  <React.StrictMode>
    <WebApp />
  </React.StrictMode>
)
