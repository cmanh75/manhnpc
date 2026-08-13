import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, Clock } from 'lucide-react'
import { PageShell, SectionHeading, Reveal } from '../components/ui'
import { api } from '../lib/api'
import type { Post } from '../lib/types'
import { clsx, formatDate, formatNumber } from '../lib/utils'

export function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)

  useEffect(() => {
    api.getPosts({ size: 50 }).then((p) => setPosts(p.content)).catch(() => {})
  }, [])

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [posts])

  const filtered = useMemo(() => {
    let list = posts
    if (tag) list = list.filter((p) => p.tags.includes(tag))
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
    }
    return list
  }, [posts, tag, query])

  const [featured, ...rest] = filtered

  return (
    <PageShell>
      <SectionHeading
        command="cat ./thoughts/*.md | grep -v draft"
        title={<>Field <span className="text-gradient">notes</span></>}
        sub="Long-form thoughts on distributed systems, WebGL wizardry, and the occasional existential take on why I built all this."
      />

      {/* search + tags */}
      <div className="mb-10 space-y-4">
        <div className="glass flex items-center gap-3 rounded-xl px-4 py-3">
          <Search size={15} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="grep posts…"
            className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-faint"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTag(null)}
            className={clsx(
              'rounded-lg px-3 py-1 font-mono text-xs transition',
              !tag ? 'bg-violet/15 text-violet ring-1 ring-violet/40' : 'glass text-muted hover:text-ink',
            )}
          >
            all
          </button>
          {tags.map(([t, count]) => (
            <button
              key={t}
              onClick={() => setTag(tag === t ? null : t)}
              className={clsx(
                'rounded-lg px-3 py-1 font-mono text-xs transition',
                tag === t ? 'bg-violet/15 text-violet ring-1 ring-violet/40' : 'glass text-muted hover:text-ink',
              )}
            >
              #{t} <span className="text-[10px] text-faint">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* featured post */}
      {featured && (
        <Reveal>
          <Link
            to={`/blog/${featured.slug}`}
            className="border-beam glass group mb-8 grid overflow-hidden rounded-3xl md:grid-cols-2"
          >
            <div className="relative min-h-56 overflow-hidden">
              <img
                src={featured.coverImage}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-space/60 md:bg-gradient-to-l" />
              <span className="absolute left-4 top-4 rounded-md bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan backdrop-blur">
                latest
              </span>
            </div>
            <div className="flex flex-col justify-center p-7 md:p-9">
              <div className="mb-3 flex items-center gap-3 font-mono text-[11px] text-faint">
                <span>{formatDate(featured.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{featured.readingTime} min</span>
                <span className="flex items-center gap-1"><Eye size={10} />{formatNumber(featured.views)}</span>
              </div>
              <h2 className="font-display text-2xl font-bold leading-tight tracking-tight transition group-hover:text-cyan md:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 line-clamp-3 leading-relaxed text-muted">{featured.excerpt}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {featured.tags.map((t) => (
                  <span key={t} className="rounded-md bg-violet/10 px-2 py-0.5 font-mono text-[10px] text-violet">#{t}</span>
                ))}
              </div>
            </div>
          </Link>
        </Reveal>
      )}

      {/* the rest */}
      <div className="grid gap-5 md:grid-cols-2">
        {rest.map((post, i) => (
          <Reveal key={post.id} delay={(i % 2) * 0.08}>
            <Link
              to={`/blog/${post.slug}`}
              className="border-beam glass group flex h-full flex-col overflow-hidden rounded-2xl transition hover:bg-white/[0.06]"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={post.coverImage}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-space/90 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-2.5 flex items-center gap-3 font-mono text-[11px] text-faint">
                  <span>{formatDate(post.createdAt)}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{post.readingTime} min</span>
                  <span className="flex items-center gap-1"><Eye size={10} />{formatNumber(post.views)}</span>
                </div>
                <h3 className="font-display text-xl font-semibold leading-snug tracking-tight transition group-hover:text-cyan">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-md bg-violet/10 px-2 py-0.5 font-mono text-[10px] text-violet">#{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center font-mono text-sm text-faint">// no posts match “{query || tag}”</div>
      )}
    </PageShell>
  )
}
