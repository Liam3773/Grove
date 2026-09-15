import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AppDataProvider } from './data/AppDataContext'
import { SyncProvider } from './data/SyncContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </AppDataProvider>
    </BrowserRouter>
  </StrictMode>,
)
