import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Search, Plus, Trash2, Upload, Play, Clock, Pencil } from 'lucide-react'
import { PageShell, SectionHeading, Reveal } from '../components/ui'
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

/** One entry per individually viewable photo/video, in feed order — what the fullscreen viewer navigates.
 *  groupIndex/groupTotal are set only for items that belong to a multi-photo/video post, so the
 *  viewer can show "2/5" scoped to that post instead of position across the whole feed. */
type ViewerItem =
  | { kind: 'photo'; id: number; date: string; photo: Photo; groupIndex?: number; groupTotal?: number }
  | { kind: 'video'; id: number; date: string; video: Video; groupIndex?: number; groupTotal?: number }

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
      item.photos.forEach((photo, idx) => {
        viewerItems.push({ kind: 'photo', id: photo.id, date: photo.takenAt, photo, groupIndex: idx + 1, groupTotal: item.photos.length })
      })
    } else if (item.kind === 'video') {
      viewerItems.push({ kind: 'video', id: item.video.id, date: item.video.createdAt, video: item.video })
    } else {
      item.videos.forEach((video, idx) => {
        viewerItems.push({ kind: 'video', id: video.id, date: video.createdAt, video, groupIndex: idx + 1, groupTotal: item.videos.length })
      })
    }
  }
  return { viewerItems, startIndex }
}

/** Calendar-day key (local time) an item falls on, for grouping the feed into day markers. */
function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Human label for a feed day marker: "Today" / "Yesterday" / full date. */
function dayLabel(iso: string): string {
  const key = dayKey(iso)
  if (key === dayKey(new Date().toISOString())) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === dayKey(yesterday.toISOString())) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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

/** Click-and-drag horizontal scrolling for a snap-scroll track, for desktop mouse users —
 *  touch/trackpad already get this for free from native scrolling, so only mouse pointers
 *  are handled here. Suppresses the click on whatever's under the cursor once a drag moves
 *  past a small threshold, so dragging doesn't also open the item you dragged over.
 *  Tracks the drag via window-level listeners rather than setPointerCapture — capturing on
 *  the track retargets the resulting click event to the track itself instead of the button
 *  underneath it, which broke opening photos/videos on every click, not just drags. */
function useDragToScroll(trackRef: RefObject<HTMLDivElement | null>) {
  const state = useRef({ dragged: false, startX: 0, startScroll: 0 })

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current
    if (!el || e.pointerType !== 'mouse') return
    state.current = { dragged: false, startX: e.clientX, startScroll: el.scrollLeft }

    function onMove(ev: PointerEvent) {
      const delta = ev.clientX - state.current.startX
      if (Math.abs(delta) > 4) state.current.dragged = true
      el!.scrollLeft = state.current.startScroll - delta
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function onClickCapture(e: React.MouseEvent) {
    if (state.current.dragged) {
      e.preventDefault()
      e.stopPropagation()
      state.current.dragged = false
    }
  }

  return { onPointerDown, onClickCapture }
}

/** Instagram-style swipeable carousel embedded in a feed card, with dot indicators. */
function PhotoGroupCarousel({ photos, title, onOpen }: { photos: Photo[]; title: string; onOpen: (index: number) => void }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const drag = useDragToScroll(trackRef)

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
        {...drag}
        className="flex cursor-grab snap-x snap-mandatory overflow-x-auto scroll-smooth select-none [&::-webkit-scrollbar]:hidden active:cursor-grabbing"
        style={{ scrollbarWidth: 'none' }}
      >
        {photos.map((photo, i) => (
          <button key={photo.id} onClick={() => onOpen(i)} className="block w-full flex-none snap-center" data-cursor="pointer">
            <img
              src={photo.thumbnailUrl}
              alt={title}
              loading="lazy"
              draggable={false}
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
  const drag = useDragToScroll(trackRef)

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
        {...drag}
        className="flex cursor-grab snap-x snap-mandatory overflow-x-auto scroll-smooth select-none [&::-webkit-scrollbar]:hidden active:cursor-grabbing"
        style={{ scrollbarWidth: 'none' }}
      >
        {videos.map((video, i) => (
          <button key={video.id} onClick={() => onOpen(i)} className="relative block aspect-video w-full flex-none snap-center" data-cursor="pointer">
            <img
              src={video.thumbnailUrl}
              alt={title}
              loading="lazy"
              draggable={false}
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

  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'life' as string, location: '', takenAt: '', file: null as File | null })
  const [editing, setEditing] = useState(false)
  const [editProgress, setEditProgress] = useState(0)
  const [editError, setEditError] = useState<string | null>(null)

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

  // deep link from other pages (e.g. home's "Latest captures") — `?open=photo-123` opens that
  // item straight in the fullscreen viewer instead of just landing on the feed list
  useEffect(() => {
    const open = searchParams.get('open')
    if (!open) return
    const [kind, idStr] = open.split('-')
    const id = Number(idStr)
    const index = viewerItems.findIndex((item) => item.kind === kind && item.id === id)
    if (index === -1) return
    setLightbox(index)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('open')
      return next
    }, { replace: true })
  }, [viewerItems, searchParams, setSearchParams])

  // lock background scroll while either modal is open — otherwise scrolling/rubber-banding the
  // page behind lets mobile browser chrome collapse/expand, which reveals the fixed navbar and
  // in-flow footer through the fullscreen overlay. `overflow: hidden` on body alone doesn't stop
  // touch scroll on iOS/Android, so pin body to the current scroll position with `position: fixed`.
  useEffect(() => {
    if (lightbox === null && !showUpload && !showEdit) return
    const scrollY = window.scrollY
    const body = document.body.style
    const previous = { position: body.position, top: body.top, left: body.left, right: body.right, width: body.width }
    body.position = 'fixed'
    body.top = `-${scrollY}px`
    body.left = '0'
    body.right = '0'
    body.width = '100%'
    return () => {
      body.position = previous.position
      body.top = previous.top
      body.left = previous.left
      body.right = previous.right
      body.width = previous.width
      window.scrollTo(0, scrollY)
    }
  }, [lightbox, showUpload, showEdit])

  // keyboard navigation for the fullscreen viewer
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? null : Math.min(i + 1, viewerItems.length - 1)))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? null : Math.max(i - 1, 0)))
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

  function openEdit() {
    if (!current || current.kind !== 'photo') return
    setEditForm({
      title: current.photo.title,
      description: current.photo.description ?? '',
      category: current.photo.category,
      location: current.photo.location ?? '',
      takenAt: current.photo.takenAt.slice(0, 16),
      file: null,
    })
    setEditError(null)
    setShowEdit(true)
  }

  const editPreviewUrl = useMemo(() => (editForm.file ? URL.createObjectURL(editForm.file) : null), [editForm.file])
  useEffect(() => () => { if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl) }, [editPreviewUrl])

  async function submitEdit() {
    if (!current || current.kind !== 'photo' || !editForm.title.trim()) return
    setEditing(true)
    setEditProgress(0)
    setEditError(null)
    try {
      const updated = await api.updatePhoto(
        current.photo.id,
        {
          file: editForm.file ?? undefined,
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          category: editForm.category,
          location: editForm.location.trim(),
          takenAt: editForm.takenAt || undefined,
        },
        setEditProgress,
      )
      setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setShowEdit(false)
    } catch {
      setEditError('update failed — check the backend/R2 config')
    } finally {
      setEditing(false)
    }
  }

  return (
    <>
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
        {categories
          .filter((cat) => cat === 'all' || cat === category || feed.some((f) => f.category === cat))
          .map((cat) => (
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
            const showDayMarker = i === 0 || dayKey(item.date) !== dayKey(filtered[i - 1].date)
            return (
              <div key={`${item.kind}-${item.id}`} className="contents">
              {showDayMarker && (
                <div className={clsx('flex items-center gap-3 font-mono text-[11px] font-semibold tracking-wide text-cyan', i !== 0 && '-mb-2 mt-2')}>
                  <span className="h-px flex-1 bg-cyan/20" />
                  {dayLabel(item.date)}
                  <span className="h-px flex-1 bg-cyan/20" />
                </div>
              )}
              <motion.article
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
                </div>
              </motion.article>
              </div>
            )
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <Reveal>
          <div className="py-20 text-center font-mono text-sm text-faint">// nothing here yet</div>
        </Reveal>
      )}
    </PageShell>

    {/* portalled straight to <body> — PageShell animates `y` via a persistent CSS transform,
        which makes it the containing block for any `position: fixed` descendant, so a modal
        nested inside it would be confined to the page's content box instead of the viewport */}
    {createPortal(
      <>
      {/* ===== fullscreen viewer ===== */}
      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 px-16 backdrop-blur-md md:px-24"
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
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-ink transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30 md:left-8"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((i) => (i === null ? null : Math.max(i - 1, 0)))
              }}
              disabled={(lightbox ?? 0) === 0}
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>

            <motion.figure
              key={`${current.kind}-${current.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="max-h-[86svh] max-w-full cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                const threshold = 60
                if ((info.offset.x < -threshold || info.velocity.x < -400) && (lightbox ?? 0) < viewerItems.length - 1) {
                  setLightbox((i) => (i === null ? null : Math.min(i + 1, viewerItems.length - 1)))
                } else if ((info.offset.x > threshold || info.velocity.x > 400) && (lightbox ?? 0) > 0) {
                  setLightbox((i) => (i === null ? null : Math.max(i - 1, 0)))
                }
              }}
            >
              {current.kind === 'photo' ? (
                <img
                  src={current.photo.url}
                  alt={current.photo.title}
                  draggable={false}
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
                  {owner && current.kind === 'photo' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit()
                      }}
                      className="flex items-center gap-1.5 text-cyan transition hover:text-cyan/80"
                    >
                      <Pencil size={11} /> edit
                    </button>
                  )}
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
                </div>
              </figcaption>
            </motion.figure>

            <button
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-ink transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30 md:right-8"
              onClick={(e) => {
                e.stopPropagation()
                setLightbox((i) => (i === null ? null : Math.min(i + 1, viewerItems.length - 1)))
              }}
              disabled={(lightbox ?? 0) === viewerItems.length - 1}
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[11px] text-faint">
              {current.groupTotal ? `${current.groupIndex} / ${current.groupTotal} · ` : ''}use ← → keys
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
              className="glass max-h-[85svh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
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
                {uploadForm.type === 'photo' && (
                  <input
                    value={uploadForm.location}
                    onChange={(e) => setUploadForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="location (optional)"
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

      {/* ===== owner edit-photo modal ===== */}
      <AnimatePresence>
        {owner && showEdit && current?.kind === 'photo' && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !editing && setShowEdit(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass max-h-[85svh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Edit photo</h3>
                <button onClick={() => setShowEdit(false)} className="rounded-full p-1.5 text-muted transition hover:bg-white/10 hover:text-ink">
                  <X size={16} />
                </button>
              </div>

              <label className="mb-3 block cursor-pointer overflow-hidden rounded-xl border border-dashed border-white/15 transition hover:border-cyan/40">
                <img
                  src={editPreviewUrl ?? current.photo.thumbnailUrl}
                  alt=""
                  className="max-h-48 w-full object-cover"
                />
                <div className="flex items-center justify-center gap-2 bg-white/5 py-2 font-mono text-xs text-muted hover:text-cyan">
                  <Upload size={13} /> replace photo (optional)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setEditForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                />
              </label>

              <input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="title"
                className="mb-3 w-full rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 placeholder:text-faint focus:ring-cyan/50"
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="caption"
                rows={3}
                className="mb-3 w-full resize-none rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 placeholder:text-faint focus:ring-cyan/50"
              />
              <div className="mb-3 flex gap-3">
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 focus:ring-cyan/50"
                >
                  {uploadCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="location (optional)"
                  className="min-w-0 flex-1 rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 placeholder:text-faint focus:ring-cyan/50"
                />
              </div>
              <input
                type="datetime-local"
                value={editForm.takenAt}
                onChange={(e) => setEditForm((f) => ({ ...f, takenAt: e.target.value }))}
                className="mb-3 w-full rounded-xl bg-white/5 px-4 py-2.5 font-mono text-sm outline-none ring-1 ring-white/10 [color-scheme:dark] focus:ring-cyan/50"
              />

              {editError && <p className="mb-3 font-mono text-xs text-pink">{editError}</p>}

              <button
                onClick={submitEdit}
                disabled={editing || !editForm.title.trim()}
                className="relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition enabled:hover:shadow-[0_0_24px_-6px_#22d3ee] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {editing && (
                  <span
                    className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-200"
                    style={{ width: `${editProgress}%` }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <Pencil size={14} />
                  {editing ? 'saving…' : 'save changes'}
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>,
      document.body,
    )}
    </>
  )
}
