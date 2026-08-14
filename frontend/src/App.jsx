import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AdminProvider } from './context/AdminContext'
import CustomerApp from './pages/CustomerApp'
import AdminApp from './pages/AdminApp'

import { AlertProvider } from './context/AlertContext'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AlertProvider>
          <CartProvider>
              <Routes>
                <Route path="/" element={<CustomerApp />} />
                <Route path="/admin/*" element={<AdminProvider><AdminApp /></AdminProvider>} />
              </Routes>
          </CartProvider>
        </AlertProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App

