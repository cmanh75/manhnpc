import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Lock, Plus, Trash2, Save, X, Calendar, ArrowLeft, Bold, Italic, Heading2, List, Image as ImageIcon, Sigma, Eye, Pencil, Sparkles, Loader2, ArrowDownToLine, Replace } from 'lucide-react'
import { PageShell, SectionHeading, Reveal } from '../components/ui'
import { journal, type JournalEntryInput } from '../lib/api'
import type { JournalEntry } from '../lib/types'
import { formatDate, clsx } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyDraft(): JournalEntryInput {
  return { title: '', content: '', tags: [], entryDate: today() }
}

/** Wrap the current selection (or insert a placeholder) with markdown syntax. */
function wrapSelection(textarea: HTMLTextAreaElement, before: string, after: string, placeholder: string) {
  const { selectionStart, selectionEnd, value } = textarea
  const selected = value.slice(selectionStart, selectionEnd) || placeholder
  const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
  const cursor = selectionStart + before.length + selected.length + after.length
  return { next, cursor }
}

/** Prefix the current line with markdown syntax (heading, list item, …). */
function prefixLine(textarea: HTMLTextAreaElement, prefix: string) {
  const { selectionStart, value } = textarea
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
  return { next, cursor: selectionStart + prefix.length }
}

/** Insert text at the cursor, replacing any selection. */
function insertAtCursor(textarea: HTMLTextAreaElement, text: string) {
  const { selectionStart, selectionEnd, value } = textarea
  const next = value.slice(0, selectionStart) + text + value.slice(selectionEnd)
  return { next, cursor: selectionStart + text.length }
}

export function JournalPage() {
  const owner = useAppStore((s) => s.owner)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'reader' | 'editor'>('list')
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [draft, setDraft] = useState<JournalEntryInput>(emptyDraft())
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiNotes, setAiNotes] = useState('')
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [aiTitle, setAiTitle] = useState<string | null>(null)
  const [aiTags, setAiTags] = useState<string | null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetAiPanel() {
    setShowAiPanel(false)
    setAiNotes('')
    setAiReport(null)
    setAiTitle(null)
    setAiTags(null)
    setAiError(null)
  }

  async function generateAiReport() {
    if (!aiNotes.trim()) return
    setAiGenerating(true)
    setAiError(null)
    try {
      const { title, tags, report } = await journal.generateAiReport(aiNotes, draft.entryDate)
      setAiReport(report)
      setAiTitle(title)
      setAiTags(tags.length ? tags.join(', ') : null)
    } catch {
      setAiError('could not generate report — check the OpenAI key on the server')
    } finally {
      setAiGenerating(false)
    }
  }

  function useAiReport(mode: 'replace' | 'append') {
    if (!aiReport) return
    setDraft((d) => ({
      ...d,
      title: aiTitle?.trim() ? aiTitle.trim() : d.title,
      content: mode === 'replace' || !d.content.trim() ? aiReport : `${d.content}\n\n${aiReport}`,
    }))
    if (aiTags?.trim()) setTagsInput(aiTags.trim())
    resetAiPanel()
  }

  function applyEdit(fn: (ta: HTMLTextAreaElement) => { next: string; cursor: number }) {
    const ta = textareaRef.current
    if (!ta) return
    const { next, cursor } = fn(ta)
    setDraft((d) => ({ ...d, content: next }))
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(cursor, cursor)
    })
  }

  async function uploadImages(files: FileList | File[]) {
    const file = files[0]
    if (!file) return
    setUploadingImage(true)
    setError(null)
    try {
      const url = await journal.uploadImage(file)
      applyEdit((ta) => insertAtCursor(ta, `![${file.name}](${url})\n`))
    } catch {
      setError('could not upload image')
    } finally {
      setUploadingImage(false)
    }
  }

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

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    entries.forEach((e) => e.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [entries])

  const filteredEntries = useMemo(
    () => (tagFilter ? entries.filter((e) => e.tags.includes(tagFilter)) : entries),
    [entries, tagFilter],
  )

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
    setShowPreview(false)
    resetAiPanel()
    setView('editor')
  }

  function openView(entry: JournalEntry) {
    setEditing(entry)
    setView('reader')
  }

  function openEdit(entry: JournalEntry) {
    setEditing(entry)
    setDraft({ title: entry.title, content: entry.content, tags: entry.tags, entryDate: entry.entryDate })
    setTagsInput(entry.tags.join(', '))
    setShowPreview(false)
    resetAiPanel()
    setView('editor')
  }

  async function save() {
    setSaving(true)
    const payload: JournalEntryInput = {
      ...draft,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    }
    try {
      const wasEditing = editing !== null
      const saved = editing ? await journal.update(editing.id, payload) : await journal.create(payload)
      setEntries((prev) => {
        const next = wasEditing ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]
        return [...next].sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.id - a.id)
      })
      setEditing(saved)
      setView(wasEditing ? 'reader' : 'list')
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

  if (view === 'reader' && editing) {
    const entry = editing
    return (
      <PageShell>
        <button
          onClick={() => setView('list')}
          className="group mb-8 inline-flex items-center gap-2 font-mono text-sm text-muted transition hover:text-cyan"
        >
          <ArrowLeft size={14} className="transition group-hover:-translate-x-1" />
          cd ../journal
        </button>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold leading-snug tracking-tight">{entry.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-faint">
              <Calendar size={12} />
              {formatDate(entry.entryDate)}
            </p>
            {entry.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <span key={t} className="rounded-md bg-violet/10 px-2 py-0.5 font-mono text-[10px] text-violet">#{t}</span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => openEdit(entry)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/8 px-4 py-2.5 font-mono text-sm text-ink ring-1 ring-white/15 transition hover:bg-white/12"
          >
            <Pencil size={14} /> edit
          </button>
        </div>

        <div className="prose-dev glass w-full rounded-2xl p-5 text-[15px]">
          <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {entry.content}
          </Markdown>
        </div>
      </PageShell>
    )
  }

  if (view === 'editor') {
    return (
      <PageShell>
        <button
          onClick={() => setView(editing ? 'reader' : 'list')}
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

        <div className="glass mb-2 flex flex-wrap items-center gap-1 rounded-xl p-1.5">
          <button
            type="button"
            title="Bold"
            disabled={showPreview}
            onClick={() => applyEdit((ta) => wrapSelection(ta, '**', '**', 'bold text'))}
            className="rounded-lg p-2 text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            title="Italic"
            disabled={showPreview}
            onClick={() => applyEdit((ta) => wrapSelection(ta, '_', '_', 'italic text'))}
            className="rounded-lg p-2 text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            title="Heading"
            disabled={showPreview}
            onClick={() => applyEdit((ta) => prefixLine(ta, '## '))}
            className="rounded-lg p-2 text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
          >
            <Heading2 size={15} />
          </button>
          <button
            type="button"
            title="List item"
            disabled={showPreview}
            onClick={() => applyEdit((ta) => prefixLine(ta, '- '))}
            className="rounded-lg p-2 text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
          >
            <List size={15} />
          </button>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <button
            type="button"
            title="Inline math ($…$)"
            disabled={showPreview}
            onClick={() => applyEdit((ta) => wrapSelection(ta, '$', '$', 'x^2 + y^2 = z^2'))}
            className="rounded-lg p-2 text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
          >
            <Sigma size={15} />
          </button>
          <button
            type="button"
            title="Block math ($$…$$)"
            disabled={showPreview}
            onClick={() => applyEdit((ta) => wrapSelection(ta, '\n$$\n', '\n$$\n', '\\int_a^b f(x)\\,dx'))}
            className="rounded-lg px-2 py-2 font-mono text-[11px] text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
          >
            $$
          </button>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <button
            type="button"
            title="Insert image"
            disabled={uploadingImage || showPreview}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg p-2 text-muted transition hover:bg-white/8 hover:text-ink disabled:opacity-40"
          >
            <ImageIcon size={15} />
            {uploadingImage && <span className="font-mono text-[10px]">uploading…</span>}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadImages(e.target.files)
              e.target.value = ''
            }}
          />
          <div className="mx-1 h-5 w-px bg-white/10" />
          <button
            type="button"
            title="Generate an AI report from today's notes"
            disabled={showPreview}
            onClick={() => setShowAiPanel((v) => !v)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-mono text-[11px] transition disabled:opacity-40',
              showAiPanel ? 'bg-violet/15 text-violet' : 'text-muted hover:bg-white/8 hover:text-ink',
            )}
          >
            <Sparkles size={14} />
            ai report
          </button>
          <button
            type="button"
            title={showPreview ? 'Back to editing' : 'Preview rendered markdown + LaTeX'}
            onClick={() => setShowPreview((v) => !v)}
            className={clsx(
              'ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-mono text-[11px] transition',
              showPreview ? 'bg-cyan/15 text-cyan' : 'text-muted hover:bg-white/8 hover:text-ink',
            )}
          >
            {showPreview ? <Pencil size={13} /> : <Eye size={13} />}
            {showPreview ? 'write' : 'preview'}
          </button>
        </div>

        {showAiPanel && (
          <div className="glass mb-4 rounded-2xl p-4">
            <p className="mb-2 flex items-center gap-1.5 font-mono text-xs text-violet">
              <Sparkles size={13} /> ai report
            </p>
            {aiReport === null ? (
              <>
                <textarea
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="Tổng hợp những gì bạn học được hôm nay (chủ đề, khái niệm, ví dụ, v.v.) — AI sẽ đánh giá và viết thành báo cáo…"
                  data-lenis-prevent
                  className="min-h-28 w-full resize-y rounded-xl bg-black/20 p-3 font-mono text-sm outline-none placeholder:text-faint focus:ring-1 focus:ring-violet/50"
                />
                {aiError && <p className="mt-2 font-mono text-xs text-pink">{aiError}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={generateAiReport}
                    disabled={aiGenerating || !aiNotes.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet/15 px-4 py-2 font-mono text-xs font-semibold text-violet transition enabled:hover:bg-violet/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {aiGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {aiGenerating ? 'generating…' : 'generate report'}
                  </button>
                  <button
                    onClick={resetAiPanel}
                    className="font-mono text-xs text-muted transition hover:text-ink"
                  >
                    cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {aiTitle !== null && (
                  <input
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    placeholder="AI-generated title"
                    className="mb-2 w-full rounded-xl bg-black/20 p-3 font-mono text-sm font-semibold outline-none focus:ring-1 focus:ring-violet/50"
                  />
                )}
                {aiTags !== null && (
                  <input
                    value={aiTags}
                    onChange={(e) => setAiTags(e.target.value)}
                    placeholder="AI-generated tags, comma, separated"
                    className="mb-2 w-full rounded-xl bg-black/20 p-3 font-mono text-xs text-violet outline-none focus:ring-1 focus:ring-violet/50"
                  />
                )}
                <textarea
                  value={aiReport}
                  onChange={(e) => setAiReport(e.target.value)}
                  data-lenis-prevent
                  className="min-h-48 max-h-[60svh] w-full resize-y overflow-y-auto rounded-xl bg-black/20 p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-violet/50"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => useAiReport('append')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-2 font-mono text-xs text-ink ring-1 ring-white/15 transition hover:bg-white/12"
                  >
                    <ArrowDownToLine size={13} /> append to content
                  </button>
                  <button
                    onClick={() => useAiReport('replace')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan to-violet px-3 py-2 font-mono text-xs font-semibold text-void transition hover:shadow-[0_0_20px_-6px_#a855f7]"
                  >
                    <Replace size={13} /> replace content
                  </button>
                  <button
                    onClick={() => setAiReport(null)}
                    className="font-mono text-xs text-muted transition hover:text-ink"
                  >
                    back
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {showPreview ? (
          <div className="prose-dev glass min-h-[55svh] w-full overflow-y-auto rounded-2xl p-5 text-[15px]" data-lenis-prevent>
            {draft.content.trim() ? (
              <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {draft.content}
              </Markdown>
            ) : (
              <p className="font-mono text-sm text-faint">nothing to preview yet</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files.length) uploadImages(e.dataTransfer.files)
            }}
            onPaste={(e) => {
              const imageItem = Array.from(e.clipboardData.items).find((item) => item.type.startsWith('image/'))
              const file = imageItem?.getAsFile()
              if (file) {
                e.preventDefault()
                uploadImages([file])
              }
            }}
            placeholder="# markdown goes here… ($inline$ or $$block$$ LaTeX math, drag/paste images)"
            data-lenis-prevent
            className="glass min-h-[55svh] w-full resize-none rounded-2xl p-5 font-mono text-sm outline-none placeholder:text-faint focus:ring-1 focus:ring-cyan/50"
          />
        )}

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
            onClick={() => setView(editing ? 'reader' : 'list')}
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

      <div className="mb-6">
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition hover:shadow-[0_0_24px_-6px_#22d3ee]"
        >
          <Plus size={14} /> new entry
        </button>
      </div>

      {tagCounts.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setTagFilter(null)}
            className={clsx(
              'rounded-lg px-3 py-1 font-mono text-xs transition',
              !tagFilter ? 'bg-violet/15 text-violet ring-1 ring-violet/40' : 'glass text-muted hover:text-ink',
            )}
          >
            all
          </button>
          {tagCounts.map(([t, count]) => (
            <button
              key={t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className={clsx(
                'rounded-lg px-3 py-1 font-mono text-xs transition',
                tagFilter === t ? 'bg-violet/15 text-violet ring-1 ring-violet/40' : 'glass text-muted hover:text-ink',
              )}
            >
              #{t} <span className="text-[10px] text-faint">{count}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-4 font-mono text-xs text-pink">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="py-20 text-center font-mono text-sm text-faint">
          {entries.length === 0 ? '// no entries yet — write your first one' : `// no entries tagged #${tagFilter}`}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry, i) => (
            <Reveal key={entry.id} delay={(i % 4) * 0.05}>
              <button
                onClick={() => openView(entry)}
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
