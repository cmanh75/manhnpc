import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Navbar } from './components/layout/Navbar'
import { SmoothScroll } from './components/layout/SmoothScroll'
import { KonamiEgg } from './components/layout/KonamiEgg'
import { Footer } from './components/layout/Footer'
import { Backdrop } from './components/layout/Backdrop'
import { Preloader } from './components/layout/Preloader'
import { CustomCursor } from './components/layout/CustomCursor'
import { CommandPalette } from './components/layout/CommandPalette'
import { HomePage } from './pages/HomePage'
import { GlobePage } from './pages/GlobePage'
import { GalleryPage } from './pages/GalleryPage'
import { VideosPage } from './pages/VideosPage'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { GuestbookPage } from './pages/GuestbookPage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  const isGlobe = location.pathname === '/globe'

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/globe" element={<GlobePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/guestbook" element={<GuestbookPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
      {/* the globe page is a fixed fullscreen scene — no footer there */}
      {!isGlobe && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SmoothScroll />
      <Backdrop />
      <Preloader />
      <CustomCursor />
      <Navbar />
      <CommandPalette />
      <KonamiEgg />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
