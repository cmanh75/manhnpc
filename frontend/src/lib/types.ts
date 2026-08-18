export interface Post {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string[]
  category: string
  readingTime: number
  published: boolean
  createdAt: string
  updatedAt: string
  views: number
}

export interface PagedPosts {
  content: Post[]
  totalElements: number
  totalPages: number
  page: number
}

export interface Photo {
  id: number
  title: string
  description: string
  url: string
  thumbnailUrl: string
  groupId?: string | null
  position?: number
  category: 'travel' | 'food' | 'code' | 'life'
  location: string
  takenAt: string
  width: number
  height: number
  featured: boolean
  views: number
}

export interface Video {
  id: number
  title: string
  description: string
  url: string
  thumbnailUrl: string
  groupId?: string | null
  position?: number
  durationSeconds: number
  category: string
  createdAt: string
  views: number
}

export interface Profile {
  name: string
  alias: string
  role: string
  company: string
  location: string
  bio: string
  avatarUrl?: string
  skills: string[]
  socials: { github?: string; linkedin?: string; email?: string }
  stats: {
    yearsOfExperience: number
    projectsCompleted: number
    countriesVisited: number
    cupsOfCoffee: number
  }
}

export interface GuestbookEntry {
  id: string
  name: string
  message: string
  emoji: string
  createdAt: string
}

export interface JournalEntry {
  id: number
  title: string
  content: string
  tags: string[]
  entryDate: string
  createdAt: string
  updatedAt: string
}

export interface VisitLog {
  id: number
  ipAddress: string
  userAgent: string
  browser: string
  os: string
  path: string
  referrer: string | null
  language: string | null
  country: string | null
  city: string | null
  createdAt: string
}

export interface PagedVisits {
  content: VisitLog[]
  totalElements: number
  totalPages: number
  number: number
}

export interface CountEntry {
  label: string
  count: number
}

export interface VisitStats {
  totalVisits: number
  uniqueIps: number
  visitsToday: number
  visitsLast30Days: number
  topPaths: CountEntry[]
  topReferrers: CountEntry[]
  browsers: CountEntry[]
  operatingSystems: CountEntry[]
  topCountries: CountEntry[]
  topCities: CountEntry[]
  visitsByDay: CountEntry[]
}
