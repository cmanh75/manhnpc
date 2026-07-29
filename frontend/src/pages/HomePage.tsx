import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Trophy,
} from 'lucide-react'
import { GithubIcon, LinkedinIcon } from '../components/ui/BrandIcons'
import { Reveal } from '../components/ui'

const experience = {
  period: '07/2025 — Hiện tại',
  company: 'Viettel Software',
  role: 'Junior Software Engineer',
  description:
    'Phát triển backend cho phần mềm doanh nghiệp: xây dựng và bảo trì REST API, thiết kế cơ sở dữ liệu và phối hợp trong đội ngũ Agile.',
  technologies: ['Java', 'Spring Boot', 'SQL', 'Git'],
}

const projects = [
  {
    period: '02/2026 — 06/2026',
    name: 'English Learning Supporter',
    role: 'Full-stack Developer',
    description:
      'Nền tảng hỗ trợ học tiếng Anh tích hợp LLM, giao tiếp thời gian thực và các dịch vụ backend độc lập.',
    technologies: ['Spring Boot', 'ReactJS', 'FastAPI', 'MariaDB', 'WebSocket', 'Docker', 'OpenAI', 'Gemini'],
    links: [
      { label: 'Backend', href: 'https://github.com/cmanh75/english-supporter-backend' },
      { label: 'Frontend', href: 'https://github.com/cmanh75/english-supporter-frontend' },
    ],
  },
  {
    period: '09/2025 — 12/2025',
    name: 'Yoga Detection',
    role: 'Backend Developer',
    description:
      'Ứng dụng nhận diện tư thế yoga, kết hợp backend thời gian thực với ứng dụng Flutter và Google ML Kit.',
    technologies: ['Spring Boot', 'PostgreSQL', 'Socket.IO', 'Firebase', 'Cloudinary', 'Flutter', 'Google ML Kit'],
    links: [{ label: 'GitHub', href: 'https://github.com/spad0604/Yoga_detection' }],
  },
  {
    period: '04/2025 — 07/2025',
    name: 'VGOV',
    role: 'Self-taught Developer',
    description: 'Ứng dụng web full-stack được xây dựng độc lập với REST API và cơ sở dữ liệu quan hệ.',
    technologies: ['Spring Boot', 'ReactJS', 'MariaDB'],
    links: [{ label: 'GitHub', href: 'https://github.com/cmanh75/vgov' }],
  },
]

const awards = [
  ['2025', 'Giải Nhất Code Challenge 2025 — Viettel Software'],
  ['2025', 'Giải Khuyến khích Viettel Programming Challenge 2025'],
  ['2022', 'Giải Khuyến khích Olympic Tin học Việt Nam (VOI)'],
  ['2022', 'Huy chương Đồng kỳ thi học sinh giỏi các trường THPT chuyên khu vực Duyên hải & Đồng bằng Bắc Bộ'],
]

const skillGroups = [
  { name: 'Backend', items: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'REST API', 'WebSocket'] },
  { name: 'Frontend', items: ['ReactJS', 'JavaScript', 'HTML', 'CSS'] },
  { name: 'Data & Tools', items: ['PostgreSQL', 'MariaDB', 'Docker', 'Git'] },
  { name: 'Foundations', items: ['C', 'C++', 'Competitive Programming'] },
]

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
    </div>
  )
}

export function HomePage() {
  return (
    <main className="relative z-10">
      <section id="about" className="mx-auto flex min-h-svh max-w-6xl items-center px-6 pb-20 pt-32 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="mb-4 font-mono text-sm text-cyan">Xin chào, mình là</p>
          <h1 className="font-display text-5xl font-bold leading-[1.03] tracking-tight md:text-7xl">
            Nguyễn Phi
            <br />
            <span className="text-gradient">Cường Mạnh</span>
          </h1>
          <p className="mt-5 text-xl font-medium text-ink/80">Junior Software Engineer</p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            Kỹ sư phần mềm định hướng backend, có kinh nghiệm xây dựng REST API, thiết kế cơ sở dữ liệu
            và phát triển ứng dụng full-stack. Mình tập trung vào Java Spring Boot, kiến trúc rõ ràng
            và những sản phẩm giải quyết bài toán thực tế.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#projects" className="inline-flex items-center gap-2 rounded-xl bg-cyan px-5 py-3 font-mono text-sm font-semibold text-void transition hover:shadow-[0_0_28px_-5px_#22d3ee]">
              Xem dự án <ArrowUpRight size={16} />
            </a>
            <a href="mailto:npcm752004t2k29@gmail.com" className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 font-mono text-sm text-ink transition hover:border-cyan/40">
              <Mail size={16} /> Liên hệ
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2"><MapPin size={15} className="text-violet" /> Hai Bà Trưng, Hà Nội</span>
            <a className="inline-flex items-center gap-2 transition hover:text-cyan" href="tel:+84973772148"><Phone size={15} className="text-violet" /> 0973 772 148</a>
          </div>
        </motion.div>

      </section>

      <div className="mx-auto max-w-6xl space-y-28 px-6 pb-16 md:px-10">
        <section id="experience">
          <Reveal>
            <SectionTitle eyebrow="Kinh nghiệm" title="Kinh nghiệm làm việc" />
            <article className="glass grid gap-6 rounded-2xl p-6 md:grid-cols-[180px_1fr] md:p-8">
              <p className="font-mono text-sm text-cyan">{experience.period}</p>
              <div>
                <div className="flex items-start gap-3">
                  <BriefcaseBusiness className="mt-1 shrink-0 text-violet" size={20} />
                  <div>
                    <h3 className="font-display text-xl font-bold">{experience.role}</h3>
                    <p className="mt-1 text-ink/70">{experience.company}</p>
                  </div>
                </div>
                <p className="mt-4 max-w-3xl leading-7 text-muted">{experience.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {experience.technologies.map((item) => <span key={item} className="rounded-lg bg-cyan/10 px-3 py-1 font-mono text-xs text-cyan">{item}</span>)}
                </div>
              </div>
            </article>
          </Reveal>
        </section>

        <section id="projects">
          <Reveal><SectionTitle eyebrow="Dự án" title="Dự án nổi bật" /></Reveal>
          <div className="grid gap-5">
            {projects.map((project, index) => (
              <Reveal key={project.name} delay={index * 0.08}>
                <article className="glass rounded-2xl p-6 transition hover:border-white/20 md:p-8">
                  <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                    <p className="font-mono text-sm text-cyan">{project.period}</p>
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-xl font-bold">{project.name}</h3>
                          <p className="mt-1 text-sm text-violet">{project.role}</p>
                        </div>
                        <div className="flex gap-2">
                          {project.links.map((link) => (
                            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted transition hover:text-cyan">
                              {link.label} <ArrowUpRight size={13} />
                            </a>
                          ))}
                        </div>
                      </div>
                      <p className="mt-4 max-w-3xl leading-7 text-muted">{project.description}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {project.technologies.map((item) => <span key={item} className="rounded-lg bg-white/5 px-3 py-1 font-mono text-xs text-ink/70">{item}</span>)}
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="skills">
          <Reveal><SectionTitle eyebrow="Năng lực" title="Kỹ năng chuyên môn" /></Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {skillGroups.map((group, index) => (
              <Reveal key={group.name} delay={index * 0.06}>
                <div className="glass h-full rounded-2xl p-6">
                  <div className="mb-4 flex items-center gap-2"><Code2 size={17} className="text-cyan" /><h3 className="font-display font-semibold">{group.name}</h3></div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => <span key={item} className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-muted">{item}</span>)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="education" className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <SectionTitle eyebrow="Học vấn" title="Đào tạo" />
            <div className="glass rounded-2xl p-6">
              <GraduationCap className="mb-4 text-cyan" />
              <h3 className="font-display text-lg font-bold">Đại học Bách khoa Hà Nội</h3>
              <p className="mt-1 text-violet">Khoa học máy tính · 09/2022 — Hiện tại</p>
              <p className="mt-4 text-sm leading-6 text-muted">GPA 3.25/4.00 · CPA 3.27/4.00 (2026.1)</p>
              <div className="my-5 h-px bg-white/10" />
              <h3 className="font-display font-semibold">THPT Chuyên Hà Tĩnh</h3>
              <p className="mt-1 text-sm text-muted">Chuyên Toán · 09/2019 — 09/2022</p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <SectionTitle eyebrow="Thành tích" title="Giải thưởng" />
            <div className="glass rounded-2xl p-6">
              <Trophy className="mb-4 text-amber" />
              <div className="space-y-4">
                {awards.map(([year, award]) => (
                  <div key={award} className="grid grid-cols-[48px_1fr] gap-3 text-sm">
                    <span className="font-mono text-amber">{year}</span>
                    <span className="leading-6 text-muted">{award}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section id="contact">
          <Reveal>
            <div className="border-beam glass rounded-3xl p-8 text-center md:p-12">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">Liên hệ</p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Cùng xây dựng một sản phẩm tốt.</h2>
              <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">Mình luôn sẵn sàng trao đổi về cơ hội phát triển phần mềm và những dự án thú vị.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a href="mailto:npcm752004t2k29@gmail.com" className="inline-flex items-center gap-2 rounded-xl bg-cyan px-5 py-3 font-mono text-sm font-semibold text-void"><Mail size={16} /> Email</a>
                <a href="https://github.com/cmanh75" target="_blank" rel="noreferrer" className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 font-mono text-sm"><GithubIcon size={16} /> GitHub</a>
                <a href="https://www.linkedin.com/in/cmanh75/" target="_blank" rel="noreferrer" className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 font-mono text-sm"><LinkedinIcon size={16} /> LinkedIn</a>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  )
}
