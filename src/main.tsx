import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MoodMapProvider } from './context/MoodMapContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MoodMapProvider>
      <App />
    </MoodMapProvider>
  </StrictMode>,
)
