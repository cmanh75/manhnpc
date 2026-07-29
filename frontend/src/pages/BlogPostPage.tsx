import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import Markdown from 'react-markdown'
import { ArrowLeft, Clock, Eye, Calendar } from 'lucide-react'
import { PageShell, LikeButton } from '../components/ui'
import { api } from '../lib/api'
import type { Post } from '../lib/types'
import { formatDate, formatNumber } from '../lib/utils'

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<Post | null | undefined>(null)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26 })

  useEffect(() => {
    window.scrollTo(0, 0)
    if (slug) api.getPost(slug).then((p) => setPost(p ?? undefined))
  }, [slug])

  if (post === undefined) {
    return (
      <PageShell className="py-32 text-center">
        <div className="font-mono text-sm text-faint">// 404: post not found</div>
        <Link to="/blog" className="mt-4 inline-block font-mono text-sm text-cyan hover:underline">
          ← back to blog
        </Link>
      </PageShell>
    )
  }

  if (!post) {
    return (
      <PageShell>
        <div className="skeleton mb-6 h-10 w-3/4 rounded-xl" />
        <div className="skeleton mb-10 h-64 w-full rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-4 rounded" style={{ width: `${90 - (i % 3) * 15}%` }} />
          ))}
        </div>
      </PageShell>
    )
  }

  return (
    <>
      {/* reading progress bar */}
      <motion.div
        className="fixed inset-x-0 top-0 z-[60] h-[2.5px] origin-left bg-gradient-to-r from-cyan via-violet to-pink"
        style={{ scaleX: progress }}
      />

      <PageShell>
        <Link
          to="/blog"
          className="group mb-8 inline-flex items-center gap-2 font-mono text-sm text-muted transition hover:text-cyan"
        >
          <ArrowLeft size={14} className="transition group-hover:-translate-x-1" />
          cd ../blog
        </Link>

        <article>
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="rounded-md bg-violet/10 px-2.5 py-1 font-mono text-[11px] text-violet">#{t}</span>
              ))}
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">{post.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-5 font-mono text-xs text-faint">
              <span className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(post.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Clock size={12} />{post.readingTime} min read</span>
              <span className="flex items-center gap-1.5"><Eye size={12} />{formatNumber(post.views)} views</span>
              <LikeButton likeKey={`post-${post.id}`} />
            </div>
          </header>

          <div className="relative mb-12 overflow-hidden rounded-3xl">
            <img src={post.coverImage} alt="" className="aspect-[1200/630] w-full object-cover" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
          </div>

          <div className="prose-dev mx-auto max-w-3xl text-[15.5px]">
            <Markdown>{post.content}</Markdown>
          </div>

          <footer className="mx-auto mt-16 max-w-3xl border-t border-white/8 pt-8">
            <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
              <div className="font-mono text-sm text-muted">
                <span className="text-cyan">$</span> echo "thoughts? find me on the guestbook"
              </div>
              <Link
                to="/guestbook"
                className="rounded-xl bg-gradient-to-r from-cyan to-violet px-4 py-2 font-mono text-xs font-semibold text-void transition hover:shadow-[0_0_24px_-6px_#22d3ee]"
              >
                reply →
              </Link>
            </div>
          </footer>
        </article>
      </PageShell>
    </>
  )
}
