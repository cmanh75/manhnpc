import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'

/**
 * Lenis-powered inertial smooth scrolling.
 * Disabled on /globe — that page is a fixed fullscreen scene where the
 * wheel belongs to the OrbitControls zoom.
 */
export function SmoothScroll() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname === '/globe') return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let raf = 0
    const tick = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [pathname])

  return null
}
