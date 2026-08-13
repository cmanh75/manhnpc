import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { audit } from './lib/api'
import { authSession } from './lib/auth-session'
import { goToLogin, setNavigator } from './lib/navigation'
import { useAppStore } from './store/useAppStore'
import { Navbar } from './components/layout/Navbar'
import { SmoothScroll } from './components/layout/SmoothScroll'
import { Footer } from './components/layout/Footer'
import { Backdrop } from './components/layout/Backdrop'
import { Preloader } from './components/layout/Preloader'
import { CustomCursor } from './components/layout/CustomCursor'
const CommandPalette = lazy(() => import('./components/layout/CommandPalette').then((module) => ({ default: module.CommandPalette })))
const KonamiEgg = lazy(() => import('./components/layout/KonamiEgg').then((module) => ({ default: module.KonamiEgg })))
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const GlobePage = lazy(() => import('./pages/GlobePage').then((module) => ({ default: module.GlobePage })))
const GalleryPage = lazy(() => import('./pages/GalleryPage').then((module) => ({ default: module.GalleryPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then((module) => ({ default: module.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then((module) => ({ default: module.BlogPostPage })))
const GuestbookPage = lazy(() => import('./pages/GuestbookPage').then((module) => ({ default: module.GuestbookPage })))
const JournalPage = lazy(() => import('./pages/JournalPage').then((module) => ({ default: module.JournalPage })))
const AuditPage = lazy(() => import('./pages/AuditPage').then((module) => ({ default: module.AuditPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function DeferredEnhancements() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 2200)
    return () => window.clearTimeout(timer)
  }, [])

  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <CommandPalette />
      <KonamiEgg />
    </Suspense>
  )
}

/** Registers the router's navigate function so code outside React (axios interceptors) can redirect. */
function NavigationBridge() {
  const navigate = useNavigate()
  useEffect(() => {
    setNavigator((path) => navigate(path))
  }, [navigate])
  return null
}

/** Logs the owner out and boots them to /login as soon as the JWT expires, even if the tab is left open and never hits a 401. */
function useSessionExpiryWatcher() {
  const owner = useAppStore((s) => s.owner)
  const setOwner = useAppStore((s) => s.setOwner)

  useEffect(() => {
    if (!owner) return
    const check = () => {
      if (authSession.isExpired()) {
        authSession.clear()
        setOwner(null)
        goToLogin()
      }
    }
    const interval = window.setInterval(check, 60_000)
    return () => window.clearInterval(interval)
  }, [owner, setOwner])
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
    audit.recordVisit(pathname, document.referrer)
  }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  const isGlobe = location.pathname === '/globe'

  return (
    <>
      <AnimatePresence mode="popLayout">
        <Suspense fallback={<div className="min-h-svh" />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/globe" element={<GlobePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/videos" element={<Navigate to="/gallery" replace />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/guestbook" element={<GuestbookPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
      {/* the globe page is a fixed fullscreen scene — no footer there */}
      {!isGlobe && <Footer />}
    </>
  )
}

export default function App() {
  useSessionExpiryWatcher()
  return (
    <BrowserRouter>
      <NavigationBridge />
      <ScrollToTop />
      <SmoothScroll />
      <Backdrop />
      <Preloader />
      <CustomCursor />
      <Navbar />
      <DeferredEnhancements />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
