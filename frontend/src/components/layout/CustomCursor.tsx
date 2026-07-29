import { useEffect, useRef } from 'react'

/**
 * Custom cursor: a crisp dot that snaps to the pointer plus a lagging
 * glow ring. Runs on rAF with direct DOM writes — never re-renders.
 * Automatically disabled on touch devices.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    document.body.classList.add('custom-cursor')
    const dot = dotRef.current!
    const ring = ringRef.current!

    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    let hovering = false
    let raf = 0

    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
      const target = e.target as HTMLElement
      hovering = !!target.closest('a, button, [role="button"], input, textarea, select, [data-cursor="pointer"]')
    }

    const tick = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      const scale = hovering ? 2.1 : 1
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${scale})`
      ring.style.borderColor = hovering ? 'rgba(34,211,238,0.85)' : 'rgba(34,211,238,0.4)'
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      document.body.classList.remove('custom-cursor')
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[120] hidden size-1.5 rounded-full bg-cyan md:block"
        style={{ boxShadow: '0 0 8px #22d3ee' }}
        aria-hidden
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[120] hidden size-8 rounded-full border md:block"
        style={{ transition: 'border-color 0.25s', borderColor: 'rgba(34,211,238,0.4)' }}
        aria-hidden
      />
    </>
  )
}
