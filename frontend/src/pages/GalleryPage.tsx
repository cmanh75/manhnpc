import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Search, Plus, Trash2, Upload, Play, Clock } from 'lucide-react'
import { PageShell, SectionHeading, Reveal, LikeButton } from '../components/ui'
import { api } from '../lib/api'
import type { Photo, Video } from '../lib/types'
import { clsx, formatDate, formatDuration, timeAgo } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

const categories = ['all', 'travel', 'food', 'code', 'life'] as const
const uploadCategories = categories.filter((c) => c !== 'all')

type FeedItem =
  | { kind: 'photo'; id: number; date: string; category: string; photo: Photo }
  | { kind: 'photo-group'; id: number; date: string; category: string; photos: Photo[] }
  | { kind: 'video'; id: number; date: string; category: string; video: Video }
  | { kind: 'video-group'; id: number; date: string; category: string; videos: Video[] }

/** One entry per individually viewable photo/video, in feed order — what the fullscreen viewer navigates. */
type ViewerItem =
  | { kind: 'photo'; id: number; date: string; photo: Photo }
  | { kind: 'video'; id: number; date: string; video: Video }

/** Groups items sharing a groupId together (sorted by position), keeping ungrouped items standalone. */
function groupByGroupId<T extends { groupId?: string | null; position?: number }>(items: T[]): { standalone: T[]; groups: T[][] } {
  const standalone: T[] = []
  const groups = new Map<string, T[]>()
  for (const item of items) {
    if (item.groupId) {
      const group = groups.get(item.groupId) ?? []
      group.push(item)
      groups.set(item.groupId, group)
    } else {
      standalone.push(item)
    }
  }
  return { standalone, groups: [...groups.values()].map((g) => [...g].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) }
}

function toFeed(photos: Photo[], videos: Video[]): FeedItem[] {
  const photoGrouped = groupByGroupId(photos)
  const videoGrouped = groupByGroupId(videos)

  const items: FeedItem[] = [
    ...photoGrouped.standalone.map((photo): FeedItem => ({ kind: 'photo', id: photo.id, date: photo.takenAt, category: photo.category, photo })),
    ...photoGrouped.groups.map((group): FeedItem => {
      const first = group[0]
      return { kind: 'photo-group', id: first.id, date: first.takenAt, category: first.category, photos: group }
    }),
    ...videoGrouped.standalone.map((video): FeedItem => ({ kind: 'video', id: video.id, date: video.createdAt, category: video.category, video })),
    ...videoGrouped.groups.map((group): FeedItem => {
      const first = group[0]
      return { kind: 'video-group', id: first.id, date: first.createdAt, category: first.category, videos: group }
    }),
  ]
  return items.sort((a, b) => b.date.localeCompare(a.date))
}

/** Flattens the feed into individually-viewable items, plus each feed item's starting index into that flat list. */
function toViewer(feed: FeedItem[]): { viewerItems: ViewerItem[]; startIndex: number[] } {
  const viewerItems: ViewerItem[] = []
  const startIndex: number[] = []
  for (const item of feed) {
    startIndex.push(viewerItems.length)
    if (item.kind === 'photo') {
      viewerItems.push({ kind: 'photo', id: item.photo.id, date: item.photo.takenAt, photo: item.photo })
    } else if (item.kind === 'photo-group') {
      for (const photo of item.photos) viewerItems.push({ kind: 'photo', id: photo.id, date: photo.takenAt, photo })
    } else if (item.kind === 'video') {
      viewerItems.push({ kind: 'video', id: item.video.id, date: item.video.createdAt, video: item.video })
    } else {
      for (const video of item.videos) viewerItems.push({ kind: 'video', id: video.id, date: video.createdAt, video })
    }
  }
  return { viewerItems, startIndex }
}

function feedItemTitle(item: FeedItem): string {
  switch (item.kind) {
    case 'video': return item.video.title
    case 'photo': return item.photo.title
    case 'photo-group': return item.photos[0].title
    case 'video-group': return item.videos[0].title
  }
}

function feedItemDescription(item: FeedItem): string {
  switch (item.kind) {
    case 'video': return item.video.description
    case 'photo': return item.photo.description
    case 'photo-group': return item.photos[0].description
    case 'video-group': return item.videos[0].description
  }
}

function emptyUploadForm() {
  return {
    type: 'photo' as 'photo' | 'video',
    title: '',
    description: '',
    category: 'life' as (typeof uploadCategories)[number],
    location: '',
    durationSeconds: '',
    files: [] as File[],
  }
}

/** True once (per mount) if the device has a real pointer that can hover — desktop mice, not touchscreens. */
function useHoverCapable() {
  const [hoverCapable] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches)
  return hoverCapable
}

/**
 * Video feed card: shows the thumbnail by default. On hover-capable devices it autoplays muted
 * inline when the pointer enters; on touch devices (no hover) it autoplays when scrolled to the
 * center of the viewport instead, via IntersectionObserver.
 */
function VideoTile({ video, title, onOpen }: { video: Video; title: string; onOpen: () => void }) {
  const containerRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const hoverCapable = useHoverCapable()

  useEffect(() => {
    if (playing) {
      videoRef.current?.play().catch(() => {})
    } else if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [playing])

  useEffect(() => {
    if (hoverCapable) return
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setPlaying(entry.isIntersecting), {
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hoverCapable])

  return (
    <button
      ref={containerRef}
      onClick={onOpen}
      onMouseEnter={hoverCapable ? () => setPlaying(true) : undefined}
      onMouseLeave={hoverCapable ? () => setPlaying(false) : undefined}
      className="relative block aspect-video w-full overflow-hidden"
      data-cursor="pointer"
    >
      <img
        src={video.thumbnailUrl}
        alt={title}
        loading="lazy"
        className={clsx(
          'size-full object-cover transition duration-700 group-hover:scale-[1.02]',
          playing && 'opacity-0',
        )}
      />
      <video
        ref={videoRef}
        src={video.url}
        muted
        loop
        playsInline
        preload="none"
        className={clsx(
          'absolute inset-0 size-full object-cover transition-opacity duration-300',
          playing ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      {!playing && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur transition duration-300 group-hover:scale-110 group-hover:bg-cyan/25 group-hover:ring-cyan/60">
            <Play size={20} className="ml-1 text-ink transition group-hover:text-cyan" fill="currentColor" />
          </span>
        </div>
      )}
      <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-ink backdrop-blur">
        <Clock size={10} />
        {formatDuration(video.durationSeconds)}
      </span>
    </button>
  )
}

/** Instagram-style swipeable carousel embedded in a feed card, with dot indicators. */
function PhotoGroupCarousel({ photos, title, onOpen }: { photos: Photo[]; title: string; onOpen: (index: number) => void }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    const el = trackRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActive(Math.min(photos.length - 1, Math.max(0, index)))
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {photos.map((photo, i) => (
          <button key={photo.id} onClick={() => onOpen(i)} className="block w-full flex-none snap-center" data-cursor="pointer">
            <img
              src={photo.thumbnailUrl}
              alt={title}
              loading="lazy"
              className="max-h-[560px] w-full object-cover"
            />
          </button>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-ink backdrop-blur">
            {active + 1}/{photos.length}
          </span>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <span key={i} className={clsx('size-1.5 rounded-full transition', i === active ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Instagram-style swipeable carousel embedded in a feed card, for a multi-video post. */
function VideoGroupCarousel({ videos, title, onOpen }: { videos: Video[]; title: string; onOpen: (index: number) => void }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    const el = trackRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    setActive(Math.min(videos.length - 1, Math.max(0, index)))
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {videos.map((video, i) => (
          <button key={video.id} onClick={() => onOpen(i)} className="relative block aspect-video w-full flex-none snap-center" data-cursor="pointer">
            <img
              src={video.thumbnailUrl}
              alt={title}
              loading="lazy"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 grid place-items-center bg-black/20">
              <span className="grid size-14 place-items-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur">
                <Play size={20} className="ml-1 text-ink" fill="currentColor" />
              </span>
            </div>
            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-ink backdrop-blur">
              <Clock size={10} />
              {formatDuration(video.durationSeconds)}
            </span>
          </button>
        ))}
      </div>
      {videos.length > 1 && (
        <>
          <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-ink backdrop-blur">
            {active + 1}/{videos.length}
          </span>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {videos.map((_, i) => (
              <span key={i} className={clsx('size-1.5 rounded-full transition', i === active ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function GalleryPage() {
  const owner = useAppStore((s) => s.owner)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [category, setCategory] = useState<(typeof categories)[number]>('all')
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState(emptyUploadForm())
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.getPhotos().then(setPhotos).catch(() => {})
    api.getVideos().then(setVideos).catch(() => {})
  }, [])

  const feed = useMemo(() => toFeed(photos, videos), [photos, videos])

  const filtered = useMemo(() => {
    let list = category === 'all' ? feed : feed.filter((item) => item.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((item) => {
        const title = feedItemTitle(item)
        const description = feedItemDescription(item)
        const location = item.kind === 'photo' ? item.photo.location : item.kind === 'photo-group' ? item.photos[0].location : ''
        return title.toLowerCase().includes(q) || description.toLowerCase().includes(q) || location.toLowerCase().includes(q)
      })
    }
    return list
  }, [feed, category, query])

  const { viewerItems, startIndex } = useMemo(() => toViewer(filtered), [filtered])

  // keyboard navigation for the fullscreen viewer
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? null : (i + 1) % viewerItems.length))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : (i - 1 + viewerItems.length) % viewerItems.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, viewerItems.length])

  const current = lightbox !== null ? viewerItems[lightbox] : null

  const previewUrls = useMemo(
    () => uploadForm.files.map((f) => URL.createObjectURL(f)),
    [uploadForm.files],
  )
  useEffect(() => () => previewUrls.forEach((u) => URL.revokeObjectURL(u)), [previewUrls])

  async function submitUpload() {
    if (uploadForm.files.length === 0 || !uploadForm.title.trim()) return
    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)
    try {
      if (uploadForm.type === 'photo') {
        const uploaded = await api.uploadPhotos(
          uploadForm.files,
          {
            title: uploadForm.title.trim(),
            description: uploadForm.description.trim() || undefined,
            category: uploadForm.category,
            location: uploadForm.location.trim() || undefined,
          },
          setUploadProgress,
        )
        setPhotos((prev) => [...uploaded, ...prev])
      } else {
        const uploaded = await api.uploadVideos(
          uploadForm.files,
          {
            title: uploadForm.title.trim(),
            description: uploadForm.description.trim() || undefined,
            category: uploadForm.category,
            durationSeconds: uploadForm.durationSeconds ? Number(uploadForm.durationSeconds) : undefined,
          },
          setUploadProgress,
        )
        setVideos((prev) => [...uploaded, ...prev])
      }
      setShowUpload(false)
      setUploadForm(emptyUploadForm())
    } catch {
      setUploadError('upload failed — check the backend/R2 config')
    } finally {
      setUploading(false)
    }
  }

  async function deleteCurrent() {
    if (!current) return
    const label = current.kind === 'photo' ? current.photo.title : current.video.title
    if (!confirm(`Delete "${label}"?`)) return
    setDeleting(true)
    try {
      if (current.kind === 'photo') {
        await api.deletePhoto(current.photo.id)
        setPhotos((prev) => prev.filter((p) => p.id !== current.photo.id))
      } else {
        await api.deleteVideo(current.video.id)
        setVideos((prev) => prev.filter((v) => v.id !== current.video.id))
      }
      setLightbox(null)
    } catch {
      alert('could not delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageShell>
      <SectionHeading
        command="tail -f ./memories.log"
        title={<>The <span className="text-gradient">feed</span></>}
        sub="Photos and videos in one timeline — streets, plates, screens and everything in between."
      />

      {/* active place/search filter from the globe */}
      {query && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-5 flex max-w-xl items-center gap-2 rounded-xl bg-cyan/10 px-4 py-2 font-mono text-sm text-cyan ring-1 ring-cyan/30"
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
      <div className="mx-auto mb-8 flex max-w-xl flex-wrap items-center gap-2">
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
              {cat === 'all' ? feed.length : feed.filter((f) => f.category === cat).length}
            </span>
          </button>
        ))}
        {owner && (
          <button
            onClick={() => setShowUpload(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan to-violet px-4 py-1.5 font-mono text-[13px] font-semibold text-void transition hover:shadow-[0_0_24px_-6px_#22d3ee]"
          >
            <Plus size={14} /> post
          </button>
        )}
      </div>

      {/* ===== threads-style single-column timeline ===== */}
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => {
            const title = feedItemTitle(item)
            const description = feedItemDescription(item)
            const location = item.kind === 'photo' ? item.photo.location : item.kind === 'photo-group' ? item.photos[0].location : ''
            return (
              <motion.article
                key={`${item.kind}-${item.id}`}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="border-beam group overflow-hidden rounded-2xl bg-panel"
              >
                {item.kind === 'photo' ? (
                  <button onClick={() => setLightbox(startIndex[i])} className="block w-full" data-cursor="pointer">
                    <img
                      src={item.photo.thumbnailUrl}
                      alt={title}
                      loading="lazy"
                      className="max-h-[560px] w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                    />
                  </button>
                ) : item.kind === 'photo-group' ? (
                  <PhotoGroupCarousel photos={item.photos} title={title} onOpen={(sub) => setLightbox(startIndex[i] + sub)} />
                ) : item.kind === 'video-group' ? (
                  <VideoGroupCarousel videos={item.videos} title={title} onOpen={(sub) => setLightbox(startIndex[i] + sub)} />
                ) : (
                  <VideoTile video={item.video} title={title} onOpen={() => setLightbox(startIndex[i])} />
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-faint">
                    <span className="rounded-md bg-white/8 px-2 py-0.5 text-ink/70">{item.category}</span>
                    <span>· {timeAgo(item.date)}</span>
                    {location && (
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-cyan" />{location}</span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold leading-snug tracking-tight">{title}</h3>
                  {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
                  <div className="mt-3">
                    <LikeButton likeKey={`${item.kind}-${item.id}`} />
                  </div>
                </div>
              </motion.article>
            )
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <Reveal>
          <div className="py-20 text-center font-mono text-sm text-faint">// nothing here yet</div>
        </Reveal>
      )}

      {/* ===== fullscreen viewer ===== */}
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
                setLightbox((i) => (i === null ? null : (i - 1 + viewerItems.length) % viewerItems.length))
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>

            <motion.figure
              key={`${current.kind}-${current.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-h-[86svh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {current.kind === 'photo' ? (
                <img
                  src={current.photo.url}
                  alt={current.photo.title}
                  className="max-h-[74svh] max-w-full rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <video
                  src={current.video.url}
                  poster={current.video.thumbnailUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[74svh] max-w-full rounded-xl bg-black object-contain shadow-2xl"
                />
              )}
              <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-semibold">
                    {current.kind === 'photo' ? current.photo.title : current.video.title}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {current.kind === 'photo' ? current.photo.description : current.video.description}
                  </div>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs text-faint">
                  {current.kind === 'photo' && current.photo.location && (
                    <span className="flex items-center gap-1.5"><MapPin size={11} className="text-cyan" />{current.photo.location}</span>
                  )}
                  <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(current.date)}</span>
                  {owner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCurrent()
                      }}
                      disabled={deleting}
                      className="flex items-center gap-1.5 text-pink transition hover:text-pink/80 disabled:opacity-40"
                    >
                      <Trash2 size={11} /> {deleting ? 'deleting…' : 'delete'}
                    </button>
                  )}
                  <LikeButton likeKey={`${current.kind}-${current.id}`} />
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

      {/* ===== owner upload modal ===== */}
      <AnimatePresence>
        {owner && showUpload && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !uploading && setShowUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass w-full max-w-md rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">New post</h3>
                <button onClick={() => setShowUpload(false)} className="rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-ink">
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1">
                {(['photo', 'video'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setUploadForm({ ...emptyUploadForm(), type: t })}
                    className={clsx(
                      'flex-1 rounded-lg py-1.5 font-mono text-xs transition',
                      uploadForm.type === t ? 'bg-cyan/15 text-cyan ring-1 ring-cyan/40' : 'text-muted hover:text-ink',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {uploadForm.files.length > 0 ? (
                <div className="mb-1.5 flex flex-wrap gap-2 rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
                  {uploadForm.files.map((file, i) => (
                    <div key={i} className="group/tile relative size-16 shrink-0 overflow-hidden rounded-lg bg-black/40">
                      {uploadForm.type === 'photo' ? (
                        <img src={previewUrls[i]} alt="" className="size-full object-cover" />
                      ) : (
                        <>
                          <video src={previewUrls[i]} muted preload="metadata" className="size-full object-cover" />
                          <div className="absolute inset-0 grid place-items-center bg-black/30">
                            <Play size={14} className="text-ink" fill="currentColor" />
                          </div>
                          <span className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5 text-center font-mono text-[8px] text-faint">
                            {file.name}
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setUploadForm((f) => ({ ...f, files: f.files.filter((_, idx) => idx !== i) }))}
                        className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/70 text-ink opacity-100 transition md:opacity-0 md:group-hover/tile:opacity-100"
                        aria-label="Remove"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <label className="grid size-16 shrink-0 cursor-pointer place-items-center rounded-lg border border-dashed border-white/20 text-muted transition hover:border-cyan/40 hover:text-cyan">
                    <Plus size={16} />
                    <input
                      type="file"
                      accept={uploadForm.type === 'photo' ? 'image/*' : 'video/*'}
                      multiple
                      className="hidden"
                      onChange={(e) => setUploadForm((f) => ({ ...f, files: [...f.files, ...Array.from(e.target.files ?? [])] }))}
                    />
                  </label>
                </div>
              ) : (
                <label className="mb-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center font-mono text-xs text-muted transition hover:border-cyan/40 hover:text-cyan">
                  <Upload size={15} />
                  {`choose ${uploadForm.type === 'photo' ? 'photo(s)' : 'video(s)'}`}
                  <input
                    type="file"
                    accept={uploadForm.type === 'photo' ? 'image/*' : 'video/*'}
                    multiple
                    className="hidden"
                    onChange={(e) => setUploadForm((f) => ({ ...f, files: Array.from(e.target.files ?? []) }))}
                  />
                </label>
              )}
              <p className="mb-3 min-h-[1em] font-mono text-[10px] text-faint">
                {uploadForm.files.length > 1 && `${uploadForm.files.length} files · one title/caption applies to all`}
              </p>

              <input
                value={uploadForm.title}
                onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="title"
                className="mb-3 w-full rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 placeholder:text-faint focus:ring-cyan/50"
              />
              <input
                value={uploadForm.description}
                onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="description (optional)"
                className="mb-3 w-full rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 placeholder:text-faint focus:ring-cyan/50"
              />
              <div className="mb-3 flex gap-3">
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm((f) => ({ ...f, category: e.target.value as typeof f.category }))}
                  className="rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 focus:ring-cyan/50"
                >
                  {uploadCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {uploadForm.type === 'photo' ? (
                  <input
                    value={uploadForm.location}
                    onChange={(e) => setUploadForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="location (optional)"
                    className="min-w-0 flex-1 rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 placeholder:text-faint focus:ring-cyan/50"
                  />
                ) : (
                  <input
                    value={uploadForm.durationSeconds}
                    onChange={(e) => setUploadForm((f) => ({ ...f, durationSeconds: e.target.value.replace(/\D/g, '') }))}
                    placeholder="duration in seconds (optional)"
                    inputMode="numeric"
                    className="min-w-0 flex-1 rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 placeholder:text-faint focus:ring-cyan/50"
                  />
                )}
              </div>

              {uploadError && <p className="mb-3 font-mono text-xs text-pink">{uploadError}</p>}

              <button
                onClick={submitUpload}
                disabled={uploading || uploadForm.files.length === 0 || !uploadForm.title.trim()}
                className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition enabled:hover:shadow-[0_0_24px_-6px_#22d3ee] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {uploading && (
                  <span
                    className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Upload size={14} />
                  {uploading ? (uploadProgress >= 100 ? 'processing…' : `uploading… ${uploadProgress}%`) : 'post'}
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
