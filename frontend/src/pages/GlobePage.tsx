import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe2, MousePointer2 } from 'lucide-react'
import { GlobeScene } from '../components/globe/GlobeScene'
import { PlaceCard } from '../components/globe/PlaceCard'
import { api } from '../lib/api'
import type { VisitedPlace, TravelStats } from '../lib/types'
import { mockPlaces, mockTravelStats } from '../lib/mock'
import { useAppStore } from '../store/useAppStore'
import { clsx } from '../lib/utils'

export function GlobePage() {
  const [places, setPlaces] = useState<VisitedPlace[]>(mockPlaces)
  const [stats, setStats] = useState<TravelStats>(mockTravelStats)
  const selectedPlace = useAppStore((s) => s.selectedPlace)
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  const location = useLocation()
  const flyTo = (location.state as { flyTo?: number } | null)?.flyTo

  useEffect(() => {
    api.getPlaces().then((list) => {
      setPlaces(list)
      // deep link from the command palette: fly straight to a place
      if (flyTo != null) {
        const target = list.find((p) => p.id === flyTo)
        if (target) setSelectedPlace(target)
      }
    })
    api.getTravelStats().then(setStats)
    return () => setSelectedPlace(null)
  }, [setSelectedPlace, flyTo])

  const timeline = useMemo(
    () => [...places].sort((a, b) => a.visitedAt.localeCompare(b.visitedAt)),
    [places],
  )

  return (
    <main className="relative h-svh w-full overflow-hidden">
      <GlobeScene places={places} className="absolute inset-0" />

      {/* ===== top-left panel ===== */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="pointer-events-none absolute left-5 top-24 z-20 md:left-8"
      >
        <div className="mb-2 flex items-center gap-2 font-mono text-[13px] text-cyan">
          <Globe2 size={13} />
          <span className="text-faint">$</span> ./where-have-i-been --render
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          My <span className="text-gradient">planet</span>
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Every pin is a memory. Drag to spin, scroll to zoom, click a beacon to relive it.
        </p>

        <div className="pointer-events-auto mt-5 flex gap-3">
          {[
            { value: stats.countries, label: 'countries' },
            { value: stats.places, label: 'places' },
            { value: new Date(stats.latestTrip).getFullYear() - new Date(stats.firstTrip).getFullYear() + 1, label: 'years' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl px-4 py-2.5 text-center">
              <div className="font-display text-xl font-bold text-ink">{s.value}</div>
              <div className="font-mono text-[10px] text-faint">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ===== interaction hint ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="pointer-events-none absolute right-6 top-24 z-20 hidden items-center gap-2 font-mono text-[11px] text-faint lg:flex"
      >
        <MousePointer2 size={12} />
        drag · scroll · click
      </motion.div>

      {/* ===== journey timeline ===== */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        className="absolute inset-x-0 bottom-0 z-20 pb-5"
      >
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-strong rounded-2xl p-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-mono text-[11px] text-faint">journey timeline · {new Date(stats.firstTrip).getFullYear()} → {new Date(stats.latestTrip).getFullYear()}</span>
              <span className="hidden font-mono text-[11px] text-faint sm:block">{timeline.length} stops</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {timeline.map((place, i) => {
                const active = selectedPlace?.id === place.id
                return (
                  <button
                    key={place.id}
                    onClick={() => setSelectedPlace(active ? null : place)}
                    className={clsx(
                      'group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 font-mono text-xs transition',
                      active ? 'bg-white/10 text-ink ring-1' : 'text-muted hover:bg-white/5 hover:text-ink',
                    )}
                    style={active ? { boxShadow: `0 0 20px -6px ${place.color}`, borderColor: place.color, '--tw-ring-color': `${place.color}88` } as React.CSSProperties : undefined}
                  >
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-bold text-void"
                      style={{ background: place.color, boxShadow: `0 0 10px -2px ${place.color}` }}
                    >
                      {i + 1}
                    </span>
                    <span className="whitespace-nowrap">
                      {place.name}
                      <span className="ml-1.5 text-[10px] text-faint">'{place.visitedAt.slice(2, 4)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <PlaceCard />
    </main>
  )
}
