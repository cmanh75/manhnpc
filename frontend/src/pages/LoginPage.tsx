import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Lock, LogIn, LogOut, ShieldCheck, KeyRound } from 'lucide-react'
import { PageShell } from '../components/ui'
import { auth } from '../lib/api'
import { useAppStore } from '../store/useAppStore'

function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError('new password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('passwords do not match')
      return
    }
    setBusy(true)
    try {
      await auth.changePassword(currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : null
      setError(status === 401 ? 'current password is incorrect' : 'could not change password — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!open ? (
        <motion.button
          key="toggle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/8 px-5 py-2.5 font-mono text-sm text-ink ring-1 ring-white/15 transition hover:bg-cyan/15 hover:text-cyan hover:ring-cyan/40"
        >
          <KeyRound size={14} /> change password
        </motion.button>
      ) : (
        <motion.form
          key="form"
          onSubmit={submit}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-5 text-left"
        >
          <label className="mb-1 block font-mono text-[11px] text-muted">current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="glass mb-3 w-full rounded-xl px-4 py-2.5 font-mono text-sm outline-none transition focus:ring-1 focus:ring-cyan/50"
          />
          <label className="mb-1 block font-mono text-[11px] text-muted">new password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="glass mb-3 w-full rounded-xl px-4 py-2.5 font-mono text-sm outline-none transition focus:ring-1 focus:ring-cyan/50"
          />
          <label className="mb-1 block font-mono text-[11px] text-muted">confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="glass mb-4 w-full rounded-xl px-4 py-2.5 font-mono text-sm outline-none transition focus:ring-1 focus:ring-cyan/50"
          />

          {error && <p className="mb-4 rounded-lg bg-pink/10 px-3 py-2 font-mono text-[11px] text-pink ring-1 ring-pink/30">{error}</p>}
          {success && <p className="mb-4 rounded-lg bg-mint/10 px-3 py-2 font-mono text-[11px] text-mint ring-1 ring-mint/30">password changed</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !currentPassword || !newPassword || !confirmPassword}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan to-violet px-4 py-2.5 font-mono text-sm font-semibold text-void transition enabled:hover:shadow-[0_0_24px_-6px_#22d3ee] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'saving…' : 'save'}
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              className="rounded-xl bg-white/8 px-4 py-2.5 font-mono text-sm text-muted ring-1 ring-white/15 transition hover:text-ink"
            >
              cancel
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const owner = useAppStore((s) => s.owner)
  const setOwner = useAppStore((s) => s.setOwner)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const session = await auth.login(username, password)
      setOwner(session)
      navigate('/guestbook')
    } catch {
      setError('access denied — wrong credentials or auth-service offline')
    } finally {
      setBusy(false)
    }
  }

  if (owner) {
    return (
      <PageShell className="grid min-h-[70svh] place-items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong w-[min(26rem,90vw)] rounded-2xl p-8 text-center"
        >
          <ShieldCheck className="mx-auto mb-4 text-mint" size={28} />
          <h1 className="font-display text-2xl font-bold">
            Logged in as <span className="text-gradient-mint">{owner.user.displayName || owner.user.username}</span>
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">owner mode active — moderation unlocked</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                auth.logout()
                setOwner(null)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-5 py-2.5 font-mono text-sm text-ink ring-1 ring-white/15 transition hover:bg-pink/15 hover:text-pink hover:ring-pink/40"
            >
              <LogOut size={14} /> log out
            </button>
          </div>
          <ChangePasswordForm />
        </motion.div>
      </PageShell>
    )
  }

  return (
    <PageShell className="grid min-h-[70svh] place-items-center">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong w-[min(26rem,90vw)] rounded-2xl p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-cyan/10 ring-1 ring-cyan/30">
            <Lock size={16} className="text-cyan" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">owner access</h1>
            <p className="font-mono text-[11px] text-faint">$ ssh manhnpc@universe</p>
          </div>
        </div>

        <label className="mb-1 block font-mono text-[11px] text-muted">username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="glass mb-4 w-full rounded-xl px-4 py-2.5 font-mono text-sm outline-none transition focus:ring-1 focus:ring-cyan/50"
        />

        <label className="mb-1 block font-mono text-[11px] text-muted">password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="glass mb-5 w-full rounded-xl px-4 py-2.5 font-mono text-sm outline-none transition focus:ring-1 focus:ring-cyan/50"
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg bg-pink/10 px-3 py-2 font-mono text-[11px] text-pink ring-1 ring-pink/30"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={busy || !username || !password}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-sm font-semibold text-void transition enabled:hover:shadow-[0_0_24px_-6px_#22d3ee] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LogIn size={14} />
          {busy ? 'authenticating…' : 'authenticate'}
        </button>

        <p className="mt-4 text-center font-mono text-[10px] text-faint">
          visitors don't need an account — this door is for the owner only
        </p>
      </motion.form>
    </PageShell>
  )
}
