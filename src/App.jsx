import { useState } from 'react'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { CustomizerPage } from './pages/CustomizerPage'
import { Routes, Route } from 'react-router-dom'
import { ProductDetailPage } from "./pages/ProductDetail"

function App() {

  return (
    <>
    <Routes>
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/customizer" element={<CustomizerPage />} />
    </Routes>
    </>
  )
}

export default App
