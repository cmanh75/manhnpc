import { Mail, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GithubIcon, LinkedinIcon } from '../ui/BrandIcons'

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/5">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-12 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <span className="font-mono text-sm font-semibold">
            manhnpc<span className="text-cyan">_</span>
          </span>
          <span className="font-mono text-xs text-faint">
            © {new Date().getFullYear()} · self-hosted with <Heart size={10} className="inline text-pink" fill="currentColor" /> in Hanoi
          </span>
        </div>

        <nav className="flex items-center gap-5 font-mono text-xs text-muted">
          <Link to="/globe" className="transition hover:text-cyan">globe</Link>
          <Link to="/gallery" className="transition hover:text-cyan">gallery</Link>
          <Link to="/blog" className="transition hover:text-cyan">blog</Link>
          <Link to="/guestbook" className="transition hover:text-cyan">guestbook</Link>
        </nav>

        <div className="flex items-center gap-3">
          <a href="https://github.com/manhnpc" target="_blank" rel="noreferrer" aria-label="GitHub"
            className="glass rounded-lg p-2 text-muted transition hover:text-cyan hover:ring-1 hover:ring-cyan/40">
            <GithubIcon size={15} />
          </a>
          <a href="https://linkedin.com/in/manhnpc" target="_blank" rel="noreferrer" aria-label="LinkedIn"
            className="glass rounded-lg p-2 text-muted transition hover:text-cyan hover:ring-1 hover:ring-cyan/40">
            <LinkedinIcon size={15} />
          </a>
          <a href="mailto:khanhnd75@viettel.com.vn" aria-label="Email"
            className="glass rounded-lg p-2 text-muted transition hover:text-cyan hover:ring-1 hover:ring-cyan/40">
            <Mail size={15} />
          </a>
        </div>
      </div>
    </footer>
  )
}
