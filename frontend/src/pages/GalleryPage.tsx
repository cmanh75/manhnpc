import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Search } from 'lucide-react'
import { PageShell, SectionHeading, Reveal, LikeButton } from '../components/ui'
import { api } from '../lib/api'
import type { Photo } from '../lib/types'
import { clsx, formatDate } from '../lib/utils'

const categories = ['all', 'travel', 'food', 'code', 'life'] as const

export function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [category, setCategory] = useState<(typeof categories)[number]>('all')
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  useEffect(() => {
    api.getPhotos().then(setPhotos)
  }, [])

  const filtered = useMemo(() => {
    let list = category === 'all' ? photos : photos.filter((p) => p.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.location.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    }
    return list
  }, [photos, category, query])

  // keyboard navigation for the lightbox
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? null : (i + 1) % filtered.length))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, filtered.length])

  const current = lightbox !== null ? filtered[lightbox] : null

  return (
    <PageShell wide>
      <SectionHeading
        command="find ./memories -type photo | sort -r"
        title={<>The <span className="text-gradient">gallery</span></>}
        sub="Moments frozen in pixels — streets, plates, screens and everything in between. Click any frame to open it full-bleed."
      />

      {/* active place/search filter from the globe */}
      {query && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex items-center gap-2 rounded-xl bg-cyan/10 px-4 py-2 font-mono text-sm text-cyan ring-1 ring-cyan/30"
        >
          <Search size={13} />
          filtering by “{query}”
          <button
            onClick={() => setSearchParams({})}
            className="ml-1 rounded-full p-0.5 transition hover:bg-white/10"
            aria-label="Clear filter"
          >
            <X size={13} />
          </button>
        </motion.div>
      )}

      {/* category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={clsx(
              'rounded-lg px-4 py-1.5 font-mono text-[13px] transition',
              category === cat
                ? 'bg-cyan/15 text-cyan ring-1 ring-cyan/40'
                : 'glass text-muted hover:text-ink',
            )}
          >
            {cat === 'all' ? '*' : cat}
            <span className="ml-1.5 text-[10px] text-faint">
              {cat === 'all' ? photos.length : photos.filter((p) => p.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* masonry via CSS columns */}
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((photo, i) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
              className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-panel"
            >
              <button onClick={() => setLightbox(i)} className="block w-full" data-cursor="pointer">
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  loading="lazy"
                  style={{ aspectRatio: `${photo.width}/${photo.height}` }}
                  className="w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="font-display text-sm font-semibold text-ink">{photo.title}</div>
                  <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-muted">
                    <MapPin size={10} className="text-cyan" /> {photo.location}
                  </div>
                </div>
              </button>
              <div className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100">
                <LikeButton likeKey={`photo-${photo.id}`} />
              </div>
              <span className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-0.5 font-mono text-[10px] text-ink/80 backdrop-blur">
                {photo.category}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <Reveal>
          <div className="py-20 text-center font-mono text-sm text-faint">// nothing here yet</div>
        </Reveal>
      )}

      {/* ===== lightbox ===== */}
      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-2.5 text-ink transition hover:bg-white/20"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <button
              className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-ink transition hover:bg-white/20 md:left-8"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length))
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>

            <motion.figure
              key={current.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-h-[86vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={current.url}
                alt={current.title}
                className="max-h-[74vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
              <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-semibold">{current.title}</div>
                  <div className="mt-0.5 text-sm text-muted">{current.description}</div>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs text-faint">
                  <span className="flex items-center gap-1.5"><MapPin size={11} className="text-cyan" />{current.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(current.takenAt)}</span>
                  <LikeButton likeKey={`photo-${current.id}`} />
                </div>
              </figcaption>
            </motion.figure>

            <button
              className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-ink transition hover:bg-white/20 md:right-8"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((i) => (i === null ? null : (i + 1) % filtered.length))
              }}
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[11px] text-faint">
              {(lightbox ?? 0) + 1} / {filtered.length} · use ← → keys
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
