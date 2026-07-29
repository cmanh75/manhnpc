import { Mail } from 'lucide-react'
import { GithubIcon, LinkedinIcon } from '../ui/BrandIcons'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-10 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p className="font-mono text-sm font-semibold">Nguyễn Phi Cường Mạnh<span className="text-cyan">_</span></p>
          <p className="mt-1 text-xs text-faint">© {new Date().getFullYear()} · Junior Software Engineer · Hà Nội</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/cmanh75" target="_blank" rel="noreferrer" aria-label="GitHub" className="glass rounded-lg p-2 text-muted transition hover:text-cyan"><GithubIcon size={15} /></a>
          <a href="https://www.linkedin.com/in/cmanh75/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="glass rounded-lg p-2 text-muted transition hover:text-cyan"><LinkedinIcon size={15} /></a>
          <a href="mailto:npcm752004t2k29@gmail.com" aria-label="Email" className="glass rounded-lg p-2 text-muted transition hover:text-cyan"><Mail size={15} /></a>
        </div>
      </div>
    </footer>
  )
}
