import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, Terminal, X } from 'lucide-react'
import { clsx } from '../../lib/utils'

const links = [
  { to: '#about', label: 'About' },
  { to: '#experience', label: 'Experience' },
  { to: '#projects', label: 'Projects' },
  { to: '#skills', label: 'Skills' },
  { to: '#contact', label: 'Contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

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
      transition={{ duration: 0.7 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav className={clsx('relative flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all md:px-6', scrolled || open ? 'glass-strong shadow-2xl shadow-black/40' : 'border border-transparent')}>
        <a href="#about" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan/20 to-violet/20 ring-1 ring-white/15"><Terminal size={15} className="text-cyan" /></span>
          <span className="font-mono text-sm font-semibold">cmanh75<span className="animate-blink text-cyan">_</span></span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => <a key={link.to} href={link.to} className="rounded-lg px-3 py-1.5 font-mono text-xs text-muted transition hover:bg-white/5 hover:text-cyan">{link.label}</a>)}
        </div>

        <button type="button" aria-label="Open menu" onClick={() => setOpen((value) => !value)} className="glass grid size-9 place-items-center rounded-lg text-muted md:hidden">
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>

        {open && (
          <div className="glass-strong absolute inset-x-0 top-[calc(100%+8px)] flex flex-col rounded-2xl p-2 md:hidden">
            {links.map((link) => <a key={link.to} href={link.to} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-mono text-sm text-muted hover:bg-white/5 hover:text-cyan">{link.label}</a>)}
          </div>
        )}
      </nav>
    </motion.header>
  )
}
