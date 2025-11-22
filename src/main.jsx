import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WindowProvider } from './context/WindowContext.jsx'
import { BrowserRouter } from 'react-router-dom'
import { SearchProvider } from './context/SearchContext.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <WindowProvider>
  <SearchProvider>
    <App />
  </SearchProvider>
  </WindowProvider>
  </BrowserRouter>
  
)
