import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { SETTINGS_KEY, resolveSettings } from './data/settings.js'
import { applyTheme } from './utils/theme.js'
import './index.css'

// 初回描画前にテーマを反映して、ちらつきを防ぐ
try { applyTheme(resolveSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY))).theme) } catch { /* 読めなければ自動 */ }

// 本番ビルドでは Service Worker を登録し、オフラインでも開けるようにする
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {}))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
