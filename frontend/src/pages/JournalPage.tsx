import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import { Lock, Plus, Trash2, Save, X, Calendar, ArrowLeft } from 'lucide-react'
import { PageShell, SectionHeading, Reveal } from '../components/ui'
import { journal, type JournalEntryInput } from '../lib/api'
import type { JournalEntry } from '../lib/types'
import { formatDate } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyDraft(): JournalEntryInput {
  return { title: '', content: '', tags: [], entryDate: today() }
}

export function JournalPage() {
  const owner = useAppStore((s) => s.owner)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [draft, setDraft] = useState<JournalEntryInput>(emptyDraft())
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!owner) return
    setLoading(true)
    journal
      .list()
      .then((list) => {
        setEntries(list)
        setError(null)
      })
      .catch(() => setError('could not load journal entries'))
      .finally(() => setLoading(false))
  }, [owner])

  if (!owner) {
    return (
      <PageShell className="grid min-h-[60svh] place-items-center text-center">
        <div>
          <Lock className="mx-auto mb-4 text-faint" size={28} />
          <h1 className="font-display text-2xl font-bold">owner only</h1>
          <p className="mt-2 font-mono text-xs text-muted">this journal is private — log in to read or write entries</p>
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

  function openNew() {
    setEditing(null)
    setDraft(emptyDraft())
    setTagsInput('')
    setView('editor')
  }

  function openEdit(entry: JournalEntry) {
    setEditing(entry)
    setDraft({ title: entry.title, content: entry.content, tags: entry.tags, entryDate: entry.entryDate })
    setTagsInput(entry.tags.join(', '))
    setView('editor')
  }

  async function save() {
    setSaving(true)
    const payload: JournalEntryInput = {
      ...draft,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    }
    try {
      const saved = editing ? await journal.update(editing.id, payload) : await journal.create(payload)
      setEntries((prev) => {
        const next = editing ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]
        return [...next].sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.id - a.id)
      })
      setView('list')
    } catch {
      setError('could not save entry')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!editing) return
    if (!confirm(`Delete "${editing.title}"?`)) return
    try {
      await journal.remove(editing.id)
      setEntries((prev) => prev.filter((e) => e.id !== editing.id))
      setView('list')
    } catch {
      setError('could not delete entry')
    }
  }

  if (view === 'editor') {
    return (
      <PageShell>
        <button
          onClick={() => setView('list')}
          className="group mb-8 inline-flex items-center gap-2 font-mono text-sm text-muted transition hover:text-cyan"
        >
          <ArrowLeft size={14} className="transition group-hover:-translate-x-1" />
          cd ../journal
        </button>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="what did you learn today?"
            className="glass min-w-0 flex-1 rounded-xl px-4 py-2.5 font-display text-lg font-semibold outline-none placeholder:text-faint focus:ring-1 focus:ring-cyan/50"
          />
          <label className="glass flex items-center gap-2 rounded-xl px-3 py-2.5 font-mono text-xs text-muted">
            <Calendar size={13} />
            <input
              type="date"
              value={draft.entryDate}
              onChange={(e) => setDraft((d) => ({ ...d, entryDate: e.target.value }))}
              className="bg-transparent outline-none"
            />
          </label>
        </div>

        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="tags, comma, separated"
          className="glass mb-6 w-full rounded-xl px-4 py-2.5 font-mono text-xs outline-none placeholder:text-faint focus:ring-1 focus:ring-cyan/50"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <textarea
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            placeholder="# markdown goes here…"
            className="glass min-h-[50svh] w-full resize-none rounded-2xl p-5 font-mono text-sm outline-none placeholder:text-faint focus:ring-1 focus:ring-cyan/50"
          />
          <div className="prose-dev glass min-h-[50svh] overflow-y-auto rounded-2xl p-5 text-[14px]">
            <Markdown>{draft.content || '_preview will render here_'}</Markdown>
          </div>
        </div>

        {error && <p className="mt-4 font-mono text-xs text-pink">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving || !draft.title.trim() || !draft.content.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition enabled:hover:shadow-[0_0_24px_-6px_#22d3ee] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={14} />
            {saving ? 'saving…' : 'save'}
          </button>
          <button
            onClick={() => setView('list')}
            className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-5 py-2.5 font-mono text-sm text-ink ring-1 ring-white/15 transition hover:bg-white/12"
          >
            <X size={14} /> cancel
          </button>
          {editing && (
            <button
              onClick={remove}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-pink/10 px-5 py-2.5 font-mono text-sm text-pink ring-1 ring-pink/30 transition hover:bg-pink/15 hover:ring-pink/50"
            >
              <Trash2 size={14} /> delete
            </button>
          )}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <SectionHeading
        command="cat ./journal/*.md"
        title={<>Daily <span className="text-gradient">journal</span></>}
        sub="Private notes on what I learned today — only visible to me."
      />

      <div className="mb-8">
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition hover:shadow-[0_0_24px_-6px_#22d3ee]"
        >
          <Plus size={14} /> new entry
        </button>
      </div>

      {error && <p className="mb-4 font-mono text-xs text-pink">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-20 text-center font-mono text-sm text-faint">// no entries yet — write your first one</div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <Reveal key={entry.id} delay={(i % 4) * 0.05}>
              <button
                onClick={() => openEdit(entry)}
                className="border-beam glass group flex w-full flex-col gap-2 rounded-2xl p-5 text-left transition hover:bg-white/[0.06]"
              >
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-faint">
                  <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(entry.entryDate)}</span>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug tracking-tight transition group-hover:text-cyan">
                  {entry.title}
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted">{entry.content.slice(0, 140)}</p>
                {entry.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {entry.tags.map((t) => (
                      <span key={t} className="rounded-md bg-violet/10 px-2 py-0.5 font-mono text-[10px] text-violet">#{t}</span>
                    ))}
                  </div>
                )}
              </button>
            </Reveal>
          ))}
        </div>
      )}
    </PageShell>
  )
}
