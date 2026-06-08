'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { EventWithVenue } from '@/lib/types'
import CityHeader from './CityHeader'
import HeroCarousel from './HeroCarousel'
import CategoryRow from './CategoryRow'
import StoriesRow from './StoriesRow'

const CATEGORY_GROUPS = [
  {
    id: 'sorties' as const,
    title: 'Sorties & Nightlife',
    label: 'Sorties & Nightlife',
    dbCategories: ['Nightlife', 'Club', 'Rooftop', 'Lounge', 'Beach Party', 'Underground', 'Festival'],
  },
  {
    id: 'concerts' as const,
    title: 'Concerts & Live Music',
    label: 'Concerts & Live Music',
    dbCategories: ['Jazz', 'Concert', 'Live Music', 'Afrobeats', 'Classical', 'Acoustic', 'DJ Set', 'Music'],
  },
  {
    id: 'food' as const,
    title: 'Food & Drinks',
    label: 'Food & Drinks',
    dbCategories: ['Restaurant', 'Brunch', 'Food', 'Fine Dining', 'Street Food', 'Wine', 'Gastronomie'],
  },
  {
    id: 'culture' as const,
    title: 'Culture & Art',
    label: 'Culture & Art',
    dbCategories: ['Culture', 'Art', 'Exhibition', 'Cinema', 'Comedy', 'Theatre', 'Cultural'],
  },
  {
    id: 'wellness' as const,
    title: 'Wellness & Outdoor',
    label: 'Wellness & Outdoor',
    dbCategories: ['Yoga', 'Beach', 'Sports', 'Market', 'Family', 'Outdoor', 'Wellness'],
  },
  {
    id: 'experiences' as const,
    title: 'Expériences',
    label: 'Experiences',
    dbCategories: ['Experience', 'Pop-up', 'VIP', 'Secret', 'Unique', 'Special', 'Popup'],
  },
]

type CategoryId = (typeof CATEGORY_GROUPS)[number]['id']
type FilterValue = 'all' | 'tonight' | 'free' | CategoryId

const CATEGORY_IDS = CATEGORY_GROUPS.map((g) => g.id) as string[]

const FILTER_CHIPS: { label: string; value: FilterValue }[] = [
  { label: 'Tout', value: 'all' },
  { label: 'Ce soir', value: 'tonight' },
  { label: 'Gratuit', value: 'free' },
  { label: 'Sorties', value: 'sorties' },
  { label: 'Concerts', value: 'concerts' },
  { label: 'Food', value: 'food' },
  { label: 'Culture', value: 'culture' },
  { label: 'Wellness', value: 'wellness' },
  { label: 'Expériences', value: 'experiences' },
]

interface Props {
  allEvents: EventWithVenue[]
  heroEvents: EventWithVenue[]
}

export default function HomeClient({ allEvents, heroEvents }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all')
  const [orderedIds, setOrderedIds] = useState<CategoryId[]>(
    CATEGORY_GROUPS.map((g) => g.id)
  )
  const [goingCounts, setGoingCounts] = useState<Record<string, number>>({})
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Load personalized row order from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vybz-cat-prefs')
      if (!raw) return
      const prefs: Record<string, number> = JSON.parse(raw)
      const sorted = [...CATEGORY_GROUPS]
        .sort((a, b) => (prefs[b.id] ?? 0) - (prefs[a.id] ?? 0))
        .map((g) => g.id)
      setOrderedIds(sorted)
    } catch {
      // localStorage unavailable or corrupt — fall back to default order
    }
  }, [])

  const trackCategory = useCallback((id: string) => {
    try {
      const raw = localStorage.getItem('vybz-cat-prefs')
      const prefs: Record<string, number> = raw ? JSON.parse(raw) : {}
      prefs[id] = (prefs[id] ?? 0) + 1
      localStorage.setItem('vybz-cat-prefs', JSON.stringify(prefs))
    } catch {}
  }, [])

  // Fetch going counts client-side for all home page events
  useEffect(() => {
    if (!allEvents.length) return
    const ids = allEvents.map((e) => e.id)
    supabase
      .from('event_attendance')
      .select('event_id')
      .eq('status', 'going')
      .in('event_id', ids)
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        for (const r of (data ?? []) as { event_id: string }[]) {
          counts[r.event_id] = (counts[r.event_id] ?? 0) + 1
        }
        setGoingCounts(counts)
      })
  }, [allEvents])

  const today = new Date().toISOString().split('T')[0]

  const handleFilter = (value: FilterValue) => {
    setActiveFilter(value)
    if (CATEGORY_IDS.includes(value)) {
      // Scroll to the matching row
      setTimeout(() => {
        rowRefs.current[value]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Apply time/price filter to all events
  const filteredAll = allEvents.filter((e) => {
    if (activeFilter === 'tonight') return e.event_date === today
    if (activeFilter === 'free') return e.is_free === true
    return true
  })

  // Hero events: apply same time/price filter
  const filteredHero = (() => {
    if (activeFilter === 'tonight') {
      const f = heroEvents.filter((e) => e.event_date === today)
      return f.length ? f : heroEvents
    }
    if (activeFilter === 'free') {
      const f = heroEvents.filter((e) => e.is_free === true)
      return f.length ? f : heroEvents
    }
    return heroEvents
  })()

  // Build rows in personalized order
  const orderedGroups = orderedIds
    .map((id) => CATEGORY_GROUPS.find((g) => g.id === id)!)
    .filter(Boolean)

  const grouped = orderedGroups.map((group) => ({
    ...group,
    events: filteredAll
      .filter((e) =>
        group.dbCategories.some(
          (cat) => e.category?.toLowerCase() === cat.toLowerCase()
        )
      )
      .slice(0, 12),
  }))

  // When a category chip is active, show only that row
  const isCategoryFilter = CATEGORY_IDS.includes(activeFilter)
  const visibleGroups = isCategoryFilter
    ? grouped.filter((g) => g.id === activeFilter)
    : grouped

  const allEmpty = visibleGroups.every((g) => g.events.length === 0)

  return (
    <div className="min-h-screen bg-[#08080F]">
      {/* Mobile header: logo + city + bell + avatar */}
      <div className="md:hidden">
        <CityHeader />
      </div>

      {/* Stories row — between header and feed */}
      <StoriesRow />

      {/* Filter chips */}
      <div className="pt-4 pb-1">
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FILTER_CHIPS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                activeFilter === f.value
                  ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 border-transparent text-white shadow-[0_0_14px_rgba(217,70,239,0.45)]'
                  : 'bg-zinc-900 border-purple-900/30 text-white/50 hover:text-white/80 hover:border-purple-700/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero swipeable carousel */}
      <HeroCarousel events={filteredHero} />

      {/* Category rows */}
      {!allEmpty ? (
        visibleGroups.map((group) => (
          <div
            key={group.id}
            ref={(el) => {
              rowRefs.current[group.id] = el
            }}
          >
            <CategoryRow
              title={group.title}
              categoryLabel={group.label}
              events={group.events}
              href={`/events?category=${group.id}`}
              onVoirTout={() => trackCategory(group.id)}
              goingCounts={goingCounts}
            />
          </div>
        ))
      ) : (
        <div className="px-4 py-20 text-center">
          <p className="text-white/30 text-sm">
            {activeFilter === 'tonight'
              ? 'Aucun événement ce soir'
              : activeFilter === 'free'
              ? 'Aucun événement gratuit disponible'
              : 'Aucun événement disponible'}
          </p>
        </div>
      )}
    </div>
  )
}
