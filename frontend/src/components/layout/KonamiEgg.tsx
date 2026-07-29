import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MatrixRain } from '../ui/Effects'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/** ↑↑↓↓←→←→BA anywhere on the site drops you into the matrix. */
export function KonamiEgg() {
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    let progress = 0
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === KONAMI[progress]) {
        progress++
        if (progress === KONAMI.length) {
          progress = 0
          setTriggered(true)
        }
      } else {
        progress = key === KONAMI[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AnimatePresence>
      {triggered && <MatrixRain key="konami" onDone={() => setTriggered(false)} duration={8000} />}
    </AnimatePresence>
  )
}
