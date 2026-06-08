import { supabase } from '@/lib/supabase'
import type { EventWithVenue } from '@/lib/types'
import CityHeader from '@/components/home/CityHeader'
import HeroCarousel from '@/components/home/HeroCarousel'
import CategoryRow from '@/components/home/CategoryRow'
import SearchBar from '@/components/home/SearchBar'

export const revalidate = 60

// Maps the 6 UI category rows to the DB category values
const CATEGORY_GROUPS = [
  {
    id: 'sorties',
    title: 'Sorties & Nightlife',
    label: 'Sorties & Nightlife',
    dbCategories: ['Nightlife', 'Club', 'Rooftop', 'Lounge', 'Beach Party', 'Underground', 'Festival'],
    href: '/events',
  },
  {
    id: 'concerts',
    title: 'Concerts & Live Music',
    label: 'Concerts & Live Music',
    dbCategories: ['Jazz', 'Concert', 'Live Music', 'Afrobeats', 'Classical', 'Acoustic', 'DJ Set', 'Music'],
    href: '/events',
  },
  {
    id: 'food',
    title: 'Food & Drinks',
    label: 'Food & Drinks',
    dbCategories: ['Restaurant', 'Brunch', 'Food', 'Fine Dining', 'Street Food', 'Wine', 'Gastronomie'],
    href: '/events',
  },
  {
    id: 'culture',
    title: 'Culture & Art',
    label: 'Culture & Art',
    dbCategories: ['Culture', 'Art', 'Exhibition', 'Cinema', 'Comedy', 'Theatre', 'Cultural'],
    href: '/events',
  },
  {
    id: 'wellness',
    title: 'Wellness & Outdoor',
    label: 'Wellness & Outdoor',
    dbCategories: ['Yoga', 'Beach', 'Sports', 'Market', 'Family', 'Outdoor', 'Wellness'],
    href: '/events',
  },
  {
    id: 'experiences',
    title: 'Expériences',
    label: 'Experiences',
    dbCategories: ['Experience', 'Pop-up', 'VIP', 'Secret', 'Unique', 'Special', 'Popup'],
    href: '/events',
  },
] as const

async function getAllEvents(): Promise<EventWithVenue[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('status', 'published')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(120)
  if (!data) return []
  const seen = new Set<string>()
  return (data as EventWithVenue[]).filter((e) => {
    const key = `${e.title}|${e.event_date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function getHeroEvents(): Promise<EventWithVenue[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('status', 'published')
    .gte('event_date', today)
    .not('cover_image', 'is', null)
    .order('is_featured', { ascending: false })
    .order('event_date', { ascending: true })
    .limit(8)
  return ((data ?? []) as EventWithVenue[])
}

export default async function HomePage() {
  const [allEvents, heroEvents] = await Promise.all([getAllEvents(), getHeroEvents()])

  // Group events into the 6 category rows (case-insensitive match)
  const grouped = CATEGORY_GROUPS.map((group) => ({
    ...group,
    events: allEvents
      .filter((e) =>
        group.dbCategories.some(
          (cat) => e.category?.toLowerCase() === cat.toLowerCase()
        )
      )
      .slice(0, 12),
  }))

  return (
    <div className="min-h-screen bg-[#08080F]">
      {/* Mobile top header — logo + city + bell + avatar */}
      <div className="md:hidden">
        <CityHeader />
      </div>

      {/* Search bar + filter chips */}
      <div className="pt-4">
        <SearchBar />
      </div>

      {/* Hero swipeable carousel */}
      <HeroCarousel events={heroEvents} />

      {/* 6 Category rows */}
      {grouped.map((group) => (
        <CategoryRow
          key={group.id}
          title={group.title}
          categoryLabel={group.label}
          events={group.events}
          href={group.href}
        />
      ))}
    </div>
  )
}
