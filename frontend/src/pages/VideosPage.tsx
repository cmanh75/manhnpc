import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, X, Clock } from 'lucide-react'
import { PageShell, SectionHeading, Reveal } from '../components/ui'
import { api } from '../lib/api'
import type { Video } from '../lib/types'
import { formatDuration, formatDate } from '../lib/utils'

export function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [playing, setPlaying] = useState<Video | null>(null)

  useEffect(() => {
    api.getVideos().then(setVideos)
  }, [])

  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPlaying(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing])

  return (
    <PageShell wide>
      <SectionHeading
        command="ffplay ./memories/*.mp4"
        title={<>Moving <span className="text-gradient">pictures</span></>}
        sub="Drone reels, dev logs and street food crawls — the memories that refused to sit still."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {videos.map((video, i) => (
          <Reveal key={video.id} delay={i * 0.08}>
            <button
              onClick={() => setPlaying(video)}
              className="border-beam group relative block w-full overflow-hidden rounded-2xl bg-panel text-left"
              data-cursor="pointer"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  loading="lazy"
                  className="size-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* play button */}
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid size-16 place-items-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur transition duration-300 group-hover:scale-110 group-hover:bg-cyan/25 group-hover:ring-cyan/60">
                    <Play size={22} className="ml-1 text-ink transition group-hover:text-cyan" fill="currentColor" />
                  </span>
                </div>

                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-ink backdrop-blur">
                  <Clock size={10} />
                  {formatDuration(video.durationSeconds)}
                </span>
                <span className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-0.5 font-mono text-[10px] text-ink/80 backdrop-blur">
                  {video.category}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-display text-lg font-semibold tracking-tight transition group-hover:text-cyan">
                  {video.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{video.description}</p>
                <div className="mt-3 font-mono text-[11px] text-faint">{formatDate(video.createdAt)}</div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      {/* ===== player modal ===== */}
      <AnimatePresence>
        {playing && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlaying(null)}
          >
            <button
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2.5 text-ink transition hover:bg-white/20"
              onClick={() => setPlaying(null)}
              aria-label="Close player"
            >
              <X size={18} />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                src={playing.url}
                poster={playing.thumbnailUrl}
                controls
                autoPlay
                className="aspect-video w-full rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
              />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold">{playing.title}</h3>
                  <p className="mt-1 text-sm text-muted">{playing.description}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
