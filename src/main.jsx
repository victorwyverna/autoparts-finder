import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app'
import { getRootElement } from '@/shared/lib/dom'

import 'bootstrap/dist/css/bootstrap.min.css'
import '@/app/styles/index.css'

createRoot(getRootElement(document)).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
