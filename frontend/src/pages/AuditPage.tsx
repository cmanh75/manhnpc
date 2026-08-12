import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Users, Eye, CalendarDays, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageShell, SectionHeading } from '../components/ui'
import { audit } from '../lib/api'
import type { VisitLog, VisitStats } from '../lib/types'
import { clsx } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-faint">
        {icon}
        {label}
      </div>
      <div className="font-display text-2xl font-bold">{value.toLocaleString()}</div>
    </div>
  )
}

/** Single-series day-count bar chart with a hover tooltip. */
function VisitsChart({ data }: { data: { label: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.count))

  if (data.length === 0) {
    return <div className="py-10 text-center font-mono text-xs text-faint">// no visits recorded yet</div>
  }

  return (
    <div className="relative">
      <div className="flex h-40 items-end gap-[3px]">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="group relative flex-1"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          >
            <div
              className={clsx(
                'w-full rounded-t-[3px] bg-cyan/60 transition-colors',
                hover === i ? 'bg-cyan' : 'group-hover:bg-cyan/80',
              )}
              style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 font-mono text-[10px] text-ink ring-1 ring-white/10">
                {d.label} · {d.count}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

function RankedList({ title, entries }: { title: string; entries: { label: string; count: number }[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count))
  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-faint">{title}</h3>
      {entries.length === 0 ? (
        <p className="font-mono text-xs text-faint">// no data yet</p>
      ) : (
        <div className="space-y-2.5">
          {entries.map((e) => (
            <div key={e.label}>
              <div className="mb-1 flex items-center justify-between gap-3 font-mono text-xs">
                <span className="truncate text-muted">{e.label}</span>
                <span className="shrink-0 text-faint">{e.count}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-violet/60" style={{ width: `${(e.count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AuditPage() {
  const owner = useAppStore((s) => s.owner)
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [visits, setVisits] = useState<VisitLog[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!owner) return
    setLoading(true)
    Promise.all([audit.stats(), audit.list(page, 50)])
      .then(([s, v]) => {
        setStats(s)
        setVisits(v.content)
        setTotalPages(v.totalPages)
        setError(null)
      })
      .catch(() => setError('could not load audit data'))
      .finally(() => setLoading(false))
  }, [owner, page])

  const chartData = useMemo(() => stats?.visitsByDay.map((d) => ({ label: d.label.slice(5), count: d.count })) ?? [], [stats])

  if (!owner) {
    return (
      <PageShell className="grid min-h-[60svh] place-items-center text-center">
        <div>
          <Lock className="mx-auto mb-4 text-faint" size={28} />
          <h1 className="font-display text-2xl font-bold">owner only</h1>
          <p className="mt-2 font-mono text-xs text-muted">access logs are private — log in to view</p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition hover:shadow-[0_0_24px_-6px_#22d3ee]"
          >
            go to login
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell wide>
      <SectionHeading
        command="tail -f ./access.log"
        title={<>Visitor <span className="text-gradient">audit</span></>}
        sub="Who's coming and going — standard access-log data only (IP, browser, page, referrer). No fingerprinting, no third-party trackers."
      />

      {error && <p className="mb-4 font-mono text-xs text-pink">{error}</p>}

      {loading && !stats ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile icon={<Eye size={12} />} label="total visits" value={stats.totalVisits} />
            <StatTile icon={<Users size={12} />} label="unique IPs" value={stats.uniqueIps} />
            <StatTile icon={<CalendarDays size={12} />} label="today" value={stats.visitsToday} />
            <StatTile icon={<TrendingUp size={12} />} label="last 30 days" value={stats.visitsLast30Days} />
          </div>

          <div className="glass mb-6 rounded-2xl p-5">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-faint">visits per day (last 30 days)</h3>
            <VisitsChart data={chartData} />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <RankedList title="top pages" entries={stats.topPaths} />
            <RankedList title="top referrers" entries={stats.topReferrers} />
            <RankedList title="browsers" entries={stats.browsers} />
            <RankedList title="operating systems" entries={stats.operatingSystems} />
          </div>

          <div className="glass overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between p-5 pb-0">
              <h3 className="font-mono text-xs uppercase tracking-wider text-faint">recent visits</h3>
              <div className="flex items-center gap-2 font-mono text-[11px] text-faint">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded p-1 transition hover:bg-white/8 disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={13} />
                </button>
                page {page + 1} / {Math.max(1, totalPages)}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded p-1 transition hover:bg-white/8 disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-faint">
                    <th className="px-5 py-2 font-normal">time</th>
                    <th className="px-5 py-2 font-normal">ip</th>
                    <th className="px-5 py-2 font-normal">path</th>
                    <th className="px-5 py-2 font-normal">browser / os</th>
                    <th className="px-5 py-2 font-normal">referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id} className="border-t border-white/5 text-muted">
                      <td className="whitespace-nowrap px-5 py-2">{new Date(v.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-2">{v.ipAddress}</td>
                      <td className="max-w-[180px] truncate px-5 py-2">{v.path}</td>
                      <td className="whitespace-nowrap px-5 py-2">{v.browser} / {v.os}</td>
                      <td className="max-w-[220px] truncate px-5 py-2">{v.referrer || '(direct)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visits.length === 0 && <div className="py-10 text-center font-mono text-xs text-faint">// no visits yet</div>}
            </div>
            <div className="h-5" />
          </div>
        </>
      ) : null}
    </PageShell>
  )
}
