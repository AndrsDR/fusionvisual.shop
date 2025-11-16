import { useState } from 'react'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { CustomizerPage } from './pages/CustomizerPage'
import { Routes, Route } from 'react-router-dom'

function App() {

  return (
    <>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/customizer" element={<CustomizerPage />} />
    </Routes>
    </>
  )
}

export default App
