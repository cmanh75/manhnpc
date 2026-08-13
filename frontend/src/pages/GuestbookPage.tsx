import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, MessageSquare, Trash2, ShieldCheck } from 'lucide-react'
import { PageShell, SectionHeading, Reveal } from '../components/ui'
import { guestbook } from '../lib/api'
import type { GuestbookEntry } from '../lib/types'
import { clsx, timeAgo } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

const emojis = ['🌏', '🚀', '🔥', '✨', '💜', '👾', '☕', '🍜']

export function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [emoji, setEmoji] = useState('🌏')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const owner = useAppStore((s) => s.owner)

  useEffect(() => {
    guestbook
      .list()
      .then((list) => setEntries(list))
      .catch(() => setError('could not reach the guestbook service'))
      .finally(() => setLoading(false))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setError(null)
    try {
      const entry = await guestbook.add(name, message, emoji)
      setEntries((prev) => [entry, ...prev])
      setName('')
      setMessage('')
      setSent(true)
      setTimeout(() => setSent(false), 2500)
    } catch {
      setError('could not send — try again in a moment')
    }
  }

  const remove = async (id: string) => {
    const ok = await guestbook.remove(id)
    if (ok) setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <PageShell>
      <SectionHeading
        command='sqlite3 guests.db "INSERT INTO visitors ..."'
        title={<>The <span className="text-gradient">guestbook</span></>}
        sub="This is a one-person social network — but the comment section belongs to you. Leave a trace so I know you orbited by."
      />

      {/* ===== form ===== */}
      <Reveal>
        <form onSubmit={submit} className="border-beam glass mb-12 rounded-2xl p-6">
          <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_auto]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="your name / handle (optional)"
              className="glass rounded-xl px-4 py-2.5 font-mono text-sm outline-none transition placeholder:text-faint focus:ring-1 focus:ring-cyan/50"
            />
            <div className="flex items-center gap-1.5">
              {emojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={clsx(
                    'grid size-9 place-items-center rounded-lg text-base transition',
                    emoji === em ? 'bg-cyan/15 ring-1 ring-cyan/50' : 'hover:bg-white/8',
                  )}
                  aria-label={`React with ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="say something nice, weird, or both…"
            className="glass w-full resize-none rounded-xl px-4 py-3 font-mono text-sm outline-none transition placeholder:text-faint focus:ring-1 focus:ring-cyan/50"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-[11px] text-faint">{message.length}/500 · signed into the guestbook-service</span>
            <button
              type="submit"
              disabled={!message.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition enabled:hover:shadow-[0_0_24px_-6px_#22d3ee] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AnimatePresence mode="wait" initial={false}>
                {sent ? (
                  <motion.span key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    transmitted ✓
                  </motion.span>
                ) : (
                  <motion.span key="send" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -6 }}>
                    <Send size={14} /> transmit
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
          {error && <p className="mt-3 font-mono text-xs text-pink">{error}</p>}
        </form>
      </Reveal>

      {owner && (
        <div className="mb-6 flex items-center gap-2 font-mono text-xs text-mint">
          <ShieldCheck size={13} />
          owner mode — you can moderate entries
        </div>
      )}

      {/* ===== entries ===== */}
      <div className="space-y-4">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass flex gap-4 rounded-2xl p-5">
              <div className="skeleton size-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-32 rounded" />
                <div className="skeleton h-3.5 w-3/4 rounded" />
              </div>
            </div>
          ))}

        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="glass group flex gap-4 rounded-2xl p-5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-white/8 to-white/2 text-xl ring-1 ring-white/10">
                {entry.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold text-cyan">{entry.name}</span>
                  <span className="font-mono text-[10px] text-faint">{timeAgo(entry.createdAt)}</span>
                </div>
                <p className="mt-1 break-words text-sm leading-relaxed text-ink/85">{entry.message}</p>
              </div>
              {owner && /^\d+$/.test(entry.id) && (
                <button
                  onClick={() => remove(entry.id)}
                  className="self-start rounded-lg p-2 text-faint opacity-100 transition hover:bg-pink/10 hover:text-pink md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && entries.length === 0 && (
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto mb-3 text-faint" size={24} />
            <div className="font-mono text-sm text-faint">// be the first to sign</div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
