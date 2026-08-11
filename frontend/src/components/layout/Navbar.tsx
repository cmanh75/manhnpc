import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Command, Terminal } from 'lucide-react'
import { clsx } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'

const links = [
  { to: '/', label: 'home', end: true },
  // globe tab temporarily hidden — route still works, just not promoted in nav
  { to: '/gallery', label: 'gallery' },
  { to: '/blog', label: 'blog' },
  { to: '/guestbook', label: 'guestbook' },
  { to: '/about', label: 'about' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen)
  const owner = useAppStore((s) => s.owner)
  const location = useLocation()
  const navLinks = owner ? [...links, { to: '/journal', label: 'journal' }] : links

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={clsx(
          'flex w-full max-w-5xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-500 md:px-6',
          scrolled ? 'glass-strong shadow-2xl shadow-black/40' : 'border border-transparent',
        )}
      >
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan/20 to-violet/20 ring-1 ring-white/15 transition group-hover:ring-cyan/50">
            <Terminal size={15} className="text-cyan" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">
            manhnpc<span className="text-cyan animate-blink">_</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.to} className="relative">
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  clsx(
                    'relative block rounded-lg px-3 py-1.5 font-mono text-[13px] transition',
                    isActive ? 'text-cyan' : 'text-muted hover:text-ink',
                  )
                }
              >
                {link.label}
              </NavLink>
              {(location.pathname === link.to || (!link.end && link.to !== '/' && location.pathname.startsWith(link.to))) && (
                <motion.span
                  layoutId="nav-glow"
                  className="absolute inset-0 -z-10 rounded-lg bg-cyan/10 ring-1 ring-cyan/25"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {owner && (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-lg bg-mint/10 px-2.5 py-1.5 font-mono text-[11px] text-mint ring-1 ring-mint/30 transition hover:ring-mint/60 sm:flex"
              title="Owner mode — click to manage session"
            >
              <span className="size-1.5 rounded-full bg-mint shadow-[0_0_6px_#34d399]" />
              owner
            </Link>
          )}
          <button
            onClick={() => setPaletteOpen(true)}
            className="glass flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs text-muted transition hover:text-ink hover:ring-1 hover:ring-cyan/40"
            aria-label="Open command palette"
          >
            <Command size={12} />
            <span className="hidden sm:inline">cmd</span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        </div>
      </nav>
    </motion.header>
  )
}
