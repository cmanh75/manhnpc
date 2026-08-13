import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { likes, api } from '../../lib/api'
import { clsx } from '../../lib/utils'
import { TextScramble } from './TextScramble'

/** Page wrapper: consistent paddings + entrance animation */
export function PageShell({ children, className, wide = false }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={clsx('relative z-10 mx-auto w-full px-5 pt-32 md:px-8', wide ? 'max-w-7xl' : 'max-w-5xl', className)}
    >
      {children}
    </motion.main>
  )
}

/** Terminal-style section heading: `$ command` + big title */
export function SectionHeading({ command, title, sub }: { command: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-10">
      <div className="mb-3 font-mono text-[13px] text-cyan">
        <span className="text-faint">$</span> <TextScramble text={command} />
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
      {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{sub}</p>}
    </div>
  )
}

/** Reveal-on-scroll wrapper */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Heart button persisted per-visitor in localStorage */
export function LikeButton({ likeKey, className }: { likeKey: string; className?: string }) {
  const [liked, setLiked] = useState(false)
  const [burst, setBurst] = useState(false)

  useEffect(() => setLiked(likes.has(likeKey)), [likeKey])

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const next = likes.toggle(likeKey)
        setLiked(next)
        if (next) {
          setBurst(true)
          setTimeout(() => setBurst(false), 500)
        }
      }}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={clsx(
        'relative grid size-9 place-items-center rounded-full backdrop-blur transition',
        liked ? 'bg-pink/20 text-pink ring-1 ring-pink/50' : 'bg-black/40 text-ink/70 ring-1 ring-white/15 hover:text-pink',
        className,
      )}
    >
      <Heart size={15} fill={liked ? 'currentColor' : 'none'} className={clsx(burst && 'animate-ping')} />
      {burst && <Heart size={15} fill="currentColor" className="absolute text-pink" />}
    </button>
  )
}

/** Small pill indicating whether the Spring gateway is reachable */
export function BackendBadge() {
  const [alive, setAlive] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    api
      .getProfile()
      .then(() => mounted && setAlive(true))
      .catch(() => mounted && setAlive(false))
    return () => {
      mounted = false
    }
  }, [])

  if (alive === null) return null
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-mono text-[10px] text-muted ring-1 ring-white/10">
      <span className={clsx('size-1.5 rounded-full', alive ? 'bg-mint shadow-[0_0_6px_#34d399]' : 'bg-amber shadow-[0_0_6px_#fbbf24]')} />
      {alive ? 'microservices: online' : 'microservices: offline'}
    </span>
  )
}

/** Animated counter that counts up when scrolled into view */
export function CountUp({ to, suffix = '', duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - t0) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(to * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}
