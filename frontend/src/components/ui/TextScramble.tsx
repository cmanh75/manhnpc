import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#$%&@abcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Decrypt-style text reveal: characters churn through random glyphs and
 * lock into place left to right once the element scrolls into view.
 */
export function TextScramble({ text, className, speed = 28 }: { text: string; className?: string; speed?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(text)

  useEffect(() => {
    if (!inView) return
    let frame = 0
    let raf = 0
    const totalFrames = Math.max(text.length * 2.4, 18)

    const tick = () => {
      frame++
      const progress = frame / totalFrames
      const locked = Math.floor(progress * text.length)
      let out = ''
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === ' ' || i < locked) out += ch
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setDisplay(out)
      if (locked < text.length) {
        raf = window.setTimeout(() => requestAnimationFrame(tick), 1000 / speed) as unknown as number
      } else {
        setDisplay(text)
      }
    }
    tick()
    return () => clearTimeout(raf)
  }, [inView, text, speed])

  return (
    <span ref={ref} className={className} aria-label={text}>
      {display}
    </span>
  )
}
