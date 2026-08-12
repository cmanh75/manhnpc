import { motion } from 'framer-motion'
import { Globe2, MousePointer2 } from 'lucide-react'
import { GlobeScene } from '../components/globe/GlobeScene'

export function GlobePage() {
  return (
    <main className="relative h-svh w-full overflow-hidden">
      <GlobeScene className="absolute inset-0" />

      {/* ===== top-left panel ===== */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="pointer-events-none absolute left-5 top-24 z-20 md:left-8"
      >
        <div className="mb-2 flex items-center gap-2 font-mono text-[13px] text-cyan">
          <Globe2 size={13} />
          <span className="text-faint">$</span> ./planet --render
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          My <span className="text-gradient">planet</span>
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          A quiet corner of the universe. Drag to spin, scroll to zoom.
        </p>
      </motion.div>

      {/* ===== interaction hint ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="pointer-events-none absolute right-6 top-24 z-20 hidden items-center gap-2 font-mono text-[11px] text-faint lg:flex"
      >
        <MousePointer2 size={12} />
        drag · scroll
      </motion.div>
    </main>
  )
}
