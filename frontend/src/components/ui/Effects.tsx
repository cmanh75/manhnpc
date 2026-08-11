import { useEffect, useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { clsx } from '../../lib/utils'

/**
 * TiltCard — 3D perspective tilt that follows the cursor, plus a
 * spotlight glow that tracks the pointer across the card surface.
 * Everything flows through motion values (no React state) so mousemove
 * never triggers a re-render — same rationale as CustomCursor.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 7,
}: {
  children: React.ReactNode
  className?: string
  maxTilt?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), { stiffness: 220, damping: 22 })
  const ry = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), { stiffness: 220, damping: 22 })
  const spotOpacity = useSpring(0, { stiffness: 300, damping: 30 })
  const spotX = useTransform(px, (v) => `${v * 100}%`)
  const spotY = useTransform(py, (v) => `${v * 100}%`)
  const spotBackground = useMotionTemplate`radial-gradient(420px circle at ${spotX} ${spotY}, rgba(34,211,238,0.10), transparent 65%)`

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 900 }}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        px.set((e.clientX - rect.left) / rect.width)
        py.set((e.clientY - rect.top) / rect.height)
        spotOpacity.set(1)
      }}
      onPointerLeave={() => {
        px.set(0.5)
        py.set(0.5)
        spotOpacity.set(0)
      }}
      className={clsx('relative', className)}
    >
      {children}
      {/* spotlight overlay */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ opacity: spotOpacity, background: spotBackground }}
      />
    </motion.div>
  )
}

/** Magnetic — the child subtly gravitates toward the cursor. */
export function Magnetic({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 180, damping: 16 })
  const sy = useSpring(y, { stiffness: 180, damping: 16 })

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onPointerMove={(e) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        x.set((e.clientX - (rect.left + rect.width / 2)) * strength)
        y.set((e.clientY - (rect.top + rect.height / 2)) * strength)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * MatrixRain — fullscreen katakana rain easter egg.
 * Triggered from the command palette; auto-dismisses.
 */
export function MatrixRain({ onDone, duration = 6000 }: { onDone: () => void; duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789$#@ABCDEF<>/\\{}[]'
    const fontSize = 15
    const cols = Math.floor(canvas.width / fontSize)
    const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -40))

    let raf = 0
    const draw = () => {
      ctx.fillStyle = 'rgba(3, 4, 9, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`
      for (let i = 0; i < cols; i++) {
        const char = glyphs[Math.floor(Math.random() * glyphs.length)]
        const y = drops[i] * fontSize
        ctx.fillStyle = Math.random() > 0.975 ? '#e8ecf8' : '#22d3ee'
        ctx.fillText(char, i * fontSize, y)
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const timer = setTimeout(onDone, duration)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [onDone, duration])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-void"
      onClick={onDone}
    >
      <canvas ref={canvasRef} className="size-full" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-mint/70">
        wake up, neo… (click to exit)
      </div>
    </motion.div>
  )
}
