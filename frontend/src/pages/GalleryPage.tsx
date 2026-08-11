import { useEffect, useMemo, useState } from 'react'
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
  | { kind: 'video'; id: number; date: string; category: string; video: Video }

function toFeed(photos: Photo[], videos: Video[]): FeedItem[] {
  const items: FeedItem[] = [
    ...photos.map((photo): FeedItem => ({ kind: 'photo', id: photo.id, date: photo.takenAt, category: photo.category, photo })),
    ...videos.map((video): FeedItem => ({ kind: 'video', id: video.id, date: video.createdAt, category: video.category, video })),
  ]
  return items.sort((a, b) => b.date.localeCompare(a.date))
}

function emptyUploadForm() {
  return {
    type: 'photo' as 'photo' | 'video',
    title: '',
    description: '',
    category: 'life' as (typeof uploadCategories)[number],
    location: '',
    durationSeconds: '',
    file: null as File | null,
  }
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.getPhotos().then(setPhotos)
    api.getVideos().then(setVideos)
  }, [])

  const feed = useMemo(() => toFeed(photos, videos), [photos, videos])

  const filtered = useMemo(() => {
    let list = category === 'all' ? feed : feed.filter((item) => item.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((item) => {
        const title = item.kind === 'photo' ? item.photo.title : item.video.title
        const description = item.kind === 'photo' ? item.photo.description : item.video.description
        const location = item.kind === 'photo' ? item.photo.location : ''
        return title.toLowerCase().includes(q) || description.toLowerCase().includes(q) || location.toLowerCase().includes(q)
      })
    }
    return list
  }, [feed, category, query])

  // keyboard navigation for the fullscreen viewer
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

  async function submitUpload() {
    if (!uploadForm.file || !uploadForm.title.trim()) return
    setUploading(true)
    setUploadError(null)
    try {
      if (uploadForm.type === 'photo') {
        const photo = await api.uploadPhoto(uploadForm.file, {
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim() || undefined,
          category: uploadForm.category,
          location: uploadForm.location.trim() || undefined,
        })
        setPhotos((prev) => [photo, ...prev])
      } else {
        const video = await api.uploadVideo(uploadForm.file, {
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim() || undefined,
          category: uploadForm.category,
          durationSeconds: uploadForm.durationSeconds ? Number(uploadForm.durationSeconds) : undefined,
        })
        setVideos((prev) => [video, ...prev])
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
            const title = item.kind === 'photo' ? item.photo.title : item.video.title
            const description = item.kind === 'photo' ? item.photo.description : item.video.description
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
                  <button onClick={() => setLightbox(i)} className="block w-full" data-cursor="pointer">
                    <img
                      src={item.photo.thumbnailUrl}
                      alt={title}
                      loading="lazy"
                      className="max-h-[560px] w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                    />
                  </button>
                ) : (
                  <button onClick={() => setLightbox(i)} className="relative block aspect-video w-full overflow-hidden" data-cursor="pointer">
                    <img
                      src={item.video.thumbnailUrl}
                      alt={title}
                      loading="lazy"
                      className="size-full object-cover transition duration-700 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid size-14 place-items-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur transition duration-300 group-hover:scale-110 group-hover:bg-cyan/25 group-hover:ring-cyan/60">
                        <Play size={20} className="ml-1 text-ink transition group-hover:text-cyan" fill="currentColor" />
                      </span>
                    </div>
                    <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-ink backdrop-blur">
                      <Clock size={10} />
                      {formatDuration(item.video.durationSeconds)}
                    </span>
                  </button>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-faint">
                    <span className="rounded-md bg-white/8 px-2 py-0.5 text-ink/70">{item.category}</span>
                    <span>· {timeAgo(item.date)}</span>
                    {item.kind === 'photo' && item.photo.location && (
                      <span className="flex items-center gap-1"><MapPin size={10} className="text-cyan" />{item.photo.location}</span>
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
                setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length))
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
              className="max-h-[86vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {current.kind === 'photo' ? (
                <img
                  src={current.photo.url}
                  alt={current.photo.title}
                  className="max-h-[74vh] max-w-full rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <video
                  src={current.video.url}
                  poster={current.video.thumbnailUrl}
                  controls
                  autoPlay
                  className="max-h-[74vh] max-w-full rounded-xl bg-black object-contain shadow-2xl"
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

              <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center font-mono text-xs text-muted transition hover:border-cyan/40 hover:text-cyan">
                <Upload size={15} />
                {uploadForm.file ? uploadForm.file.name : `choose a ${uploadForm.type}`}
                <input
                  type="file"
                  accept={uploadForm.type === 'photo' ? 'image/*' : 'video/*'}
                  className="hidden"
                  onChange={(e) => setUploadForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                />
              </label>

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
                disabled={uploading || !uploadForm.file || !uploadForm.title.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition enabled:hover:shadow-[0_0_24px_-6px_#22d3ee] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Upload size={14} />
                {uploading ? 'uploading…' : 'post'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}
