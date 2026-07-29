import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X, Calendar, Camera, Star, MapPin, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { formatDate } from '../../lib/utils'

export function PlaceCard() {
  const place = useAppStore((s) => s.selectedPlace)
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace)

  return (
    <AnimatePresence>
      {place && (
        <motion.aside
          key={place.id}
          initial={{ opacity: 0, x: 60, filter: 'blur(8px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, x: 60, filter: 'blur(8px)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="glass-strong absolute right-4 top-1/2 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-y-1/2 rounded-2xl p-6 md:right-8"
          style={{ boxShadow: `0 0 60px -18px ${place.color}88` }}
        >
          <button
            onClick={() => setSelectedPlace(null)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-ink"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="mb-1 flex items-center gap-2 font-mono text-xs text-muted">
            <MapPin size={12} style={{ color: place.color }} />
            {place.country}
            <span className="text-faint">· {place.countryCode}</span>
          </div>

          <h3 className="font-display text-2xl font-bold tracking-tight">{place.name}</h3>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDate(place.visitedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Camera size={12} />
              {place.photosCount} photos
            </span>
            <span className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  fill={i < place.rating ? place.color : 'transparent'}
                  color={i < place.rating ? place.color : '#565e78'}
                />
              ))}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink/80">{place.description}</p>

          <div
            className="mt-4 rounded-xl border px-4 py-3 font-mono text-xs leading-relaxed"
            style={{ borderColor: `${place.color}44`, background: `${place.color}0d`, color: place.color }}
          >
            &gt; {place.highlight}
          </div>

          <Link
            to={`/gallery?q=${encodeURIComponent(place.name)}`}
            className="group mt-4 inline-flex items-center gap-1.5 font-mono text-xs text-muted transition hover:text-cyan"
          >
            <Camera size={12} />
            see photos from {place.name}
            <ArrowRight size={12} className="transition group-hover:translate-x-1" />
          </Link>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
