import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/outfit'
import '@fontsource-variable/noto-sans-arabic'
import './index.css'
import App from './App.jsx'
import { SiteContentProvider } from './content/SiteContentProvider.jsx'
import { LanguageProvider } from './i18n/LanguageProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <SiteContentProvider>
          <App />
        </SiteContentProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
