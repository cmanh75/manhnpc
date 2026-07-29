import { Link } from 'react-router-dom'
import { PageShell } from '../components/ui'

export function NotFoundPage() {
  return (
    <PageShell className="grid min-h-[70svh] place-items-center">
      <div className="text-center">
        <div className="font-mono text-sm text-faint">HTTP 404</div>
        <h1 className="mt-2 font-display text-7xl font-bold tracking-tight">
          <span className="text-gradient">lost</span> in space
        </h1>
        <p className="mx-auto mt-4 max-w-sm font-mono text-sm leading-relaxed text-muted">
          this coordinate doesn't exist on my planet.
          <br />
          recalibrating navigation…
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-xl bg-gradient-to-r from-cyan to-violet px-6 py-3 font-mono text-sm font-semibold text-void transition hover:shadow-[0_0_28px_-6px_#22d3ee]"
        >
          cd ~
        </Link>
      </div>
    </PageShell>
  )
}
