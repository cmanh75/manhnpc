export interface VisitedPlace {
  id: number
  name: string
  country: string
  countryCode: string
  lat: number
  lng: number
  visitedAt: string
  description: string
  highlight: string
  color: string
  photosCount: number
  rating: number
}

export interface TravelStats {
  countries: number
  places: number
  firstTrip: string
  latestTrip: string
}

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
  category: 'travel' | 'food' | 'code' | 'life'
  location: string
  takenAt: string
  width: number
  height: number
  featured: boolean
}

export interface Video {
  id: number
  title: string
  description: string
  url: string
  thumbnailUrl: string
  durationSeconds: number
  category: string
  createdAt: string
}

export interface Profile {
  name: string
  alias: string
  role: string
  company: string
  location: string
  bio: string
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
