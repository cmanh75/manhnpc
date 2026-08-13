import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Globe2, Image as ImageIcon, FileText, MapPin, Sparkles } from 'lucide-react'
import { PageShell, Reveal, CountUp, BackendBadge } from '../components/ui'
import { TiltCard, Magnetic } from '../components/ui/Effects'
import type { Post, Photo, Profile } from '../lib/types'
import { formatDate } from '../lib/utils'

const typedPhrases = ['software engineer.', 'world wanderer.', 'pixel perfectionist.', 'phở enthusiast.', 'system architect.']
const GlobeScene = lazy(() =>
  import('../components/globe/GlobeScene').then((module) => ({ default: module.GlobeScene })),
)
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

function Typewriter() {
  const [text, setText] = useState('')
  const [phrase, setPhrase] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = typedPhrases[phrase]
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          const next = current.slice(0, text.length + 1)
          setText(next)
          if (next === current) setTimeout(() => setDeleting(true), 1600)
        } else {
          const next = current.slice(0, text.length - 1)
          setText(next)
          if (next === '') {
            setDeleting(false)
            setPhrase((p) => (p + 1) % typedPhrases.length)
          }
        }
      },
      deleting ? 34 : 74,
    )
    return () => clearTimeout(timeout)
  }, [text, deleting, phrase])

  return (
    <span className="font-mono text-cyan">
      {text}
      <span className="animate-blink">▌</span>
    </span>
  )
}

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [showGlobe, setShowGlobe] = useState(false)
  // the WebGL globe runs a continuous render loop — skip it on mobile, where it's a big source of jank
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { api } = await import('../lib/api')
      const [nextPosts, nextPhotos, nextProfile] = await Promise.all([
        api.getPosts({ size: 3 }),
        api.getPhotos(),
        api.getProfile(),
      ])
      if (cancelled) return
      setPosts(nextPosts.content.slice(0, 3))
      setPhotos(nextPhotos.filter((photo) => photo.featured).slice(0, 4))
      setProfile(nextProfile)
    }
    const timer = window.setTimeout(() => load().catch(() => {}), 450)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setShowGlobe(true), 900)
    return () => window.clearTimeout(timer)
  }, [])

  const marqueeSkills = useMemo(() => [...profile.skills, ...profile.skills], [profile.skills])

  // scroll-linked parallax: the globe recedes and dims as you scroll past the hero
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const globeY = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const globeScale = useTransform(scrollYProgress, [0, 1], [1, 0.86])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])

  return (
    <>
      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative flex min-h-svh flex-col justify-center overflow-hidden">
        {/* globe canvas fills the hero, shifted right on desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showGlobe ? 1 : 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 md:left-1/4"
        >
          <motion.div style={{ y: globeY, scale: globeScale, opacity: heroOpacity }} className="size-full">
            {showGlobe && (mobile ? (
              <div
                className="size-full"
                style={{ background: 'radial-gradient(circle at 60% 45%, rgba(34,211,238,0.18), transparent 60%)' }}
              />
            ) : (
              <Suspense fallback={null}>
                <GlobeScene ambient className="size-full" />
              </Suspense>
            ))}
          </motion.div>
        </motion.div>
        {/* readability gradient over the left column */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent md:via-void/40" />

        <motion.div style={{ y: textY }} className="pointer-events-none relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="pointer-events-auto"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 font-mono text-xs text-cyan ring-1 ring-cyan/30">
                  <Sparkles size={11} />
                  personal universe · est. 2026
                </span>
                <BackendBadge />
              </div>

              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                Hi, I'm <span className="text-gradient">Cường Mạnh</span>
                <span className="text-cyan">.</span>
              </h1>

              <p className="mt-4 text-lg text-muted md:text-xl">
                <Typewriter />
              </p>

              <p className="mt-5 max-w-md leading-relaxed text-ink/70">
                {profile.bio}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Magnetic>
                  <Link
                    to="/globe"
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-5 py-3 font-mono text-sm font-semibold text-void transition hover:shadow-[0_0_32px_-6px_#22d3ee]"
                  >
                    <Globe2 size={16} />
                    explore my planet
                    <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    to="/about"
                    className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 font-mono text-sm text-ink transition hover:ring-1 hover:ring-cyan/40"
                  >
                    whoami
                  </Link>
                </Magnetic>
              </div>

              <div className="mt-10 flex items-center gap-8 font-mono text-sm">
                <div>
                  <div className="text-2xl font-bold text-ink"><CountUp to={profile.stats.countriesVisited} /></div>
                  <div className="text-xs text-faint">countries</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-2xl font-bold text-ink"><CountUp to={profile.stats.projectsCompleted} /></div>
                  <div className="text-xs text-faint">projects shipped</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <div className="text-2xl font-bold text-ink"><CountUp to={profile.stats.yearsOfExperience} suffix="+" /></div>
                  <div className="text-xs text-faint">years shipping</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-mono text-[11px] text-faint"
        >
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            ▼ scroll to explore
          </motion.div>
        </motion.div>
      </section>

      {/* ============ SKILLS MARQUEE ============ */}
      <section className="relative z-10 border-y border-white/5 bg-space/60 py-5 backdrop-blur">
        <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
          <div className="flex w-max animate-marquee gap-3">
            {marqueeSkills.map((skill, i) => (
              <span key={i} className="glass rounded-lg px-4 py-1.5 font-mono text-[13px] text-muted">
                <span className="mr-1.5 text-cyan">◆</span>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <PageShell wide className="pt-24">
        {/* ============ FEATURED SHOTS ============ */}
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-2 font-mono text-[13px] text-cyan"><span className="text-faint">$</span> ls ./memories --featured</div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Latest captures</h2>
            </div>
            <Link to="/gallery" className="group hidden items-center gap-1.5 font-mono text-sm text-muted transition hover:text-cyan md:flex">
              view all <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo, i) => (
            <Reveal key={photo.id} delay={i * 0.08}>
              <TiltCard className="rounded-2xl">
                <Link
                  to="/gallery"
                  className="border-beam group relative block overflow-hidden rounded-2xl bg-panel"
                  style={{ aspectRatio: i % 3 === 1 ? '3/4' : '4/5' }}
                >
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="font-display text-sm font-semibold">{photo.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-muted">
                      <MapPin size={10} /> {photo.location}
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* ============ LATEST WRITING ============ */}
        <Reveal className="mt-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="mb-2 font-mono text-[13px] text-cyan"><span className="text-faint">$</span> tail -n 3 ./blog</div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Recent writing</h2>
            </div>
            <Link to="/blog" className="group hidden items-center gap-1.5 font-mono text-sm text-muted transition hover:text-cyan md:flex">
              all posts <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.1}>
              <TiltCard className="h-full rounded-2xl" maxTilt={4}>
              <Link to={`/blog/${post.slug}`} className="border-beam glass group flex h-full flex-col rounded-2xl p-6 transition hover:bg-white/[0.06]">
                <div className="mb-4 flex items-center gap-2 font-mono text-[11px] text-faint">
                  <FileText size={11} className="text-violet" />
                  {formatDate(post.createdAt)} · {post.readingTime} min
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug tracking-tight transition group-hover:text-cyan">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-md bg-violet/10 px-2 py-0.5 font-mono text-[10px] text-violet">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* ============ CTA ============ */}
        <Reveal className="mt-24">
          <div className="border-beam glass relative overflow-hidden rounded-3xl p-10 text-center md:p-16">
            <div
              className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full opacity-25 blur-[100px]"
              style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }}
            />
            <ImageIcon className="mx-auto mb-4 text-violet" size={28} />
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              This is my corner of the internet<span className="text-cyan">.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              No algorithm, no ads, no feed — just a planet of memories, a shelf of photos and some late-night writing.
              Leave a note in the guestbook so I know you passed by.
            </p>
            <Link
              to="/guestbook"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-pink px-6 py-3 font-mono text-sm font-semibold text-void transition hover:shadow-[0_0_32px_-6px_#a78bfa]"
            >
              sign the guestbook <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
      </PageShell>
    </>
  )
}
