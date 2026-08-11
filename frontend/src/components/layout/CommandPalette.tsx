import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe2, Home, Image, FileText, User, MessageSquare, Search, CornerDownLeft, Sparkles, Lock, MapPin } from 'lucide-react'
import { GithubIcon } from '../ui/BrandIcons'
import { MatrixRain } from '../ui/Effects'
import { useAppStore } from '../../store/useAppStore'
import { clsx } from '../../lib/utils'
import { api } from '../../lib/api'
import type { Post, VisitedPlace } from '../../lib/types'

interface Command {
  id: string
  label: string
  hint: string
  icon: React.ReactNode
  action: () => void
}

export function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen)
  const setOpen = useAppStore((s) => s.setPaletteOpen)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [matrix, setMatrix] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [places, setPlaces] = useState<VisitedPlace[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // lazily load searchable content the first time the palette opens
  useEffect(() => {
    if (!open || posts.length > 0) return
    api.getPosts({ size: 50 }).then((p) => setPosts(p.content))
    api.getPlaces().then(setPlaces)
  }, [open, posts.length])

  const commands = useMemo<Command[]>(
    () => [
      { id: 'home', label: 'Go home', hint: '/', icon: <Home size={15} />, action: () => navigate('/') },
      { id: 'globe', label: 'Spin the globe', hint: '/globe', icon: <Globe2 size={15} />, action: () => navigate('/globe') },
      { id: 'gallery', label: 'Browse the feed', hint: '/gallery', icon: <Image size={15} />, action: () => navigate('/gallery') },
      { id: 'blog', label: 'Read the blog', hint: '/blog', icon: <FileText size={15} />, action: () => navigate('/blog') },
      { id: 'guestbook', label: 'Sign the guestbook', hint: '/guestbook', icon: <MessageSquare size={15} />, action: () => navigate('/guestbook') },
      { id: 'about', label: 'About me', hint: '/about', icon: <User size={15} />, action: () => navigate('/about') },
      { id: 'login', label: 'Owner login', hint: '/login', icon: <Lock size={15} />, action: () => navigate('/login') },
      { id: 'github', label: 'Open GitHub', hint: 'external', icon: <GithubIcon size={15} />, action: () => window.open('https://github.com/manhnpc', '_blank') },
      { id: 'matrix', label: 'sudo enter-the-matrix', hint: 'easter egg', icon: <Sparkles size={15} />, action: () => setMatrix(true) },
    ],
    [navigate],
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    const base = commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.includes(q))

    // dynamic results: fly to a place on the globe, or open a blog post
    const placeHits: Command[] = places
      .filter((p) => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({
        id: `place-${p.id}`,
        label: `Fly to ${p.name}`,
        hint: p.country,
        icon: <MapPin size={15} style={{ color: p.color }} />,
        action: () => navigate('/globe', { state: { flyTo: p.id } }),
      }))

    const postHits: Command[] = posts
      .filter((p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)))
      .slice(0, 4)
      .map((p) => ({
        id: `post-${p.id}`,
        label: p.title,
        hint: 'blog post',
        icon: <FileText size={15} />,
        action: () => navigate(`/blog/${p.slug}`),
      }))

    return [...base, ...placeHits, ...postHits]
  }, [commands, query, places, posts, navigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useAppStore.getState().paletteOpen)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  const run = (cmd: Command) => {
    setOpen(false)
    cmd.action()
  }

  return (
    <AnimatePresence>
      {matrix && <MatrixRain key="matrix" onDone={() => setMatrix(false)} />}
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-start justify-center bg-black/55 px-4 pt-[18vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl shadow-cyan/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
              <Search size={16} className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((a) => Math.min(a + 1, filtered.length - 1))
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((a) => Math.max(a - 1, 0))
                  }
                  if (e.key === 'Enter' && filtered[active]) run(filtered[active])
                }}
                placeholder="Type a command or search…"
                className="w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-faint"
              />
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-muted">esc</kbd>
            </div>

            <ul className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center font-mono text-sm text-faint">no results for “{query}”</li>
              )}
              {filtered.map((cmd, i) => (
                <li key={cmd.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => run(cmd)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-mono text-sm transition',
                      i === active ? 'bg-cyan/12 text-ink ring-1 ring-cyan/25' : 'text-muted',
                    )}
                  >
                    <span className={clsx('grid size-7 place-items-center rounded-lg', i === active ? 'bg-cyan/15 text-cyan' : 'bg-white/5')}>
                      {cmd.icon}
                    </span>
                    <span className="flex-1">{cmd.label}</span>
                    <span className="text-[11px] text-faint">{cmd.hint}</span>
                    {i === active && <CornerDownLeft size={13} className="text-cyan" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
