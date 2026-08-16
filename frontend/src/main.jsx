import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Entry Point ของ React สำหรับเรนเดอร์ลงใน DOM (HTML) พร้อมเปิด StrictMode ป้องกันบั๊ก
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
