import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Backdrop } from './components/layout/Backdrop'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { Preloader } from './components/layout/Preloader'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter>
      <Backdrop />
      <Preloader />
      <Navbar />
      <Routes>
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
