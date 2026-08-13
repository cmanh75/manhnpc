import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin, Briefcase, Coffee, Rocket, GitCommit, Globe2, Camera, Loader2 } from 'lucide-react'
import { GithubIcon, LinkedinIcon } from '../components/ui/BrandIcons'
import { PageShell, SectionHeading, Reveal, CountUp } from '../components/ui'
import { api, auth } from '../lib/api'
import type { Profile } from '../lib/types'
import { useAppStore } from '../store/useAppStore'

const emptyProfile: Profile = {
  name: '',
  alias: '',
  role: '',
  company: '',
  location: '',
  bio: '',
  skills: [],
  socials: {},
  stats: { yearsOfExperience: 0, projectsCompleted: 0, countriesVisited: 0, cupsOfCoffee: 0 },
}

const timeline = [
  { year: '2019', title: 'Started at Ha Tinh High School for the Gifted', body: 'Studied mathematics and built the problem-solving foundation that led me into competitive programming and software.' },
  { year: '2022', title: 'Began studying Computer Science at HUST', body: 'Started my Computer Science degree at Hanoi University of Science and Technology and earned a prize at the Vietnam Olympiad in Informatics.' },
  { year: '2025', title: 'Joined Viettel Software', body: 'Started working as a Junior Software Engineer, building enterprise REST APIs and database-backed services with Java Spring Boot.' },
  { year: '2026', title: 'Built this universe', body: 'Created a self-hosted place for my memories, journeys, photos, writing, and everything I make along the way.' },
]

export function AboutPage() {
  const owner = useAppStore((s) => s.owner)
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getProfile().then(setProfile)
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingAvatar(true)
    try {
      const user = await auth.uploadAvatar(file)
      setProfile((p) => ({ ...p, avatarUrl: user.avatarUrl }))
    } catch {
      alert('could not update avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <PageShell>
      <SectionHeading
        command="whoami --verbose"
        title={<>About <span className="text-gradient">me</span></>}
        sub={profile.bio}
      />

      {/* ===== identity card ===== */}
      <Reveal>
        <div className="border-beam glass mb-14 overflow-hidden rounded-3xl">
          <div className="h-1 bg-gradient-to-r from-cyan via-violet to-pink" />
          <div className="grid gap-8 p-8 md:grid-cols-[auto_1fr] md:p-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 animate-spin-slow rounded-full bg-[conic-gradient(from_0deg,#22d3ee,#a78bfa,#f472b6,#22d3ee)] blur-[6px]" />
                <div className="relative grid size-28 place-items-center overflow-hidden rounded-full bg-space ring-2 ring-white/10">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl font-bold text-gradient">M</span>
                  )}
                </div>
                {owner && (
                  <>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-cyan text-void ring-2 ring-space transition hover:bg-cyan/80 disabled:opacity-50"
                      aria-label="Change avatar"
                      title="Change avatar"
                    >
                      {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {profile.socials.github && (
                  <a href={profile.socials.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="glass rounded-lg p-2 text-muted transition hover:text-cyan"><GithubIcon size={15} /></a>
                )}
                {profile.socials.linkedin && (
                  <a href={profile.socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="glass rounded-lg p-2 text-muted transition hover:text-cyan"><LinkedinIcon size={15} /></a>
                )}
                {profile.socials.email && (
                  <a href={`mailto:${profile.socials.email}`} aria-label="Email" className="glass rounded-lg p-2 text-muted transition hover:text-cyan"><Mail size={15} /></a>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                {profile.name} <span className="font-mono text-base font-normal text-faint">aka {profile.alias}</span>
              </h2>
              <div className="mt-2 flex flex-wrap gap-4 font-mono text-sm text-muted">
                <span className="flex items-center gap-1.5"><Briefcase size={13} className="text-cyan" />{profile.role} @ {profile.company}</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-pink" />{profile.location}</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="glass rounded-lg px-3 py-1 font-mono text-xs text-muted transition hover:text-cyan hover:ring-1 hover:ring-cyan/40">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ===== stats ===== */}
      <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: <Rocket size={18} className="text-cyan" />, value: profile.stats.yearsOfExperience, suffix: '+', label: 'years of experience' },
          { icon: <GitCommit size={18} className="text-violet" />, value: profile.stats.projectsCompleted, suffix: '+', label: 'projects shipped' },
          { icon: <Globe2 size={18} className="text-mint" />, value: profile.stats.countriesVisited, suffix: '', label: 'countries visited' },
          { icon: <Coffee size={18} className="text-amber" />, value: profile.stats.cupsOfCoffee, suffix: '+', label: 'cups of coffee' },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.07}>
            <div className="glass rounded-2xl p-5 text-center">
              <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-white/5">{stat.icon}</div>
              <div className="font-display text-2xl font-bold">
                <CountUp to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 font-mono text-[11px] text-faint">{stat.label}</div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ===== timeline ===== */}
      <Reveal>
        <div className="mb-8 font-mono text-[13px] text-cyan">
          <span className="text-faint">$</span> git log --oneline --reverse ./life
        </div>
      </Reveal>
      <div className="relative ml-3 border-l border-white/10 pl-8">
        {timeline.map((item, i) => (
          <Reveal key={item.year} delay={i * 0.08} className="relative mb-10 last:mb-0">
            <span className="absolute -left-[41px] top-1 grid size-5 place-items-center rounded-full bg-space ring-1 ring-cyan/50">
              <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_8px_#22d3ee]" />
            </span>
            <div className="font-mono text-xs text-cyan">{item.year}</div>
            <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">{item.title}</h3>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{item.body}</p>
          </Reveal>
        ))}
      </div>

      {/* ===== tech behind this site ===== */}
      <Reveal className="mt-20">
        <div className="glass rounded-3xl p-8 md:p-10">
          <div className="mb-4 font-mono text-[13px] text-cyan">
            <span className="text-faint">$</span> cat ./this-site/architecture.txt
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Under the hood</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Yes, this personal site runs on six Spring Boot microservices. Yes, that's absurd. It's also my playground —
            every pattern I want to master gets battle-tested here first.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-xl border border-white/8 bg-void/60 p-5 font-mono text-[12px] leading-relaxed text-muted">
{`┌──────────────┐     ┌─────────────────────────────────────────┐
│  React 19    │     │       Spring Cloud Gateway :8090        │
│  Three.js    │ ──▶ │  ┌────────┬─────────┬────────┬────────┐ │
│  Tailwind v4 │     │  │  auth  │ content │ media  │ travel │ │
│  Vite 8      │     │  │ :8081  │  :8082  │ :8083  │ :8084  │ │
└──────────────┘     │  └────────┴─────────┴────────┴────────┘ │
                     │        Eureka Discovery :8761           │
                     └─────────────────────────────────────────┘`}
          </pre>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/globe" className="rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-2.5 font-mono text-xs font-semibold text-void transition hover:shadow-[0_0_24px_-6px_#22d3ee]">
              see the globe it powers →
            </Link>
          </div>
        </div>
      </Reveal>
    </PageShell>
  )
}
