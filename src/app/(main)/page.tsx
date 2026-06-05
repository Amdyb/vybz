import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import EventCard from '@/components/EventCard'
import VenueCard from '@/components/VenueCard'
import type { EventWithVenue, Venue } from '@/lib/types'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'

export const revalidate = 60

async function getFeaturedEvent(): Promise<EventWithVenue | null> {
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('is_featured', true)
    .eq('status', 'published')
    .order('event_date', { ascending: true })
    .limit(1)
    .single()
  return data as EventWithVenue | null
}

async function getUpcomingEvents(): Promise<EventWithVenue[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('status', 'published')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(20)
  if (!data) return []
  // Deduplicate by title+date (DB has duplicate rows)
  const seen = new Set<string>()
  return (data as EventWithVenue[]).filter((e) => {
    const key = `${e.title}|${e.event_date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function getVenues(): Promise<Venue[]> {
  const { data } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true })
    .limit(6)
  return (data as Venue[]) ?? []
}

export default async function HomePage() {
  const [featured, events, venues] = await Promise.all([
    getFeaturedEvent(),
    getUpcomingEvents(),
    getVenues(),
  ])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-8 pb-10 md:px-8 md:pt-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-2xl">
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
            Dakar · Sénégal
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
            Vis la nuit.<br />
            <span className="gradient-text">Vis Dakar.</span>
          </h1>
          <p className="text-white/50 text-sm max-w-sm">
            Les meilleurs clubs, soirées et événements culturels de Dakar, réunis au même endroit.
          </p>
        </div>
      </section>

      {/* Featured event */}
      {featured && (
        <section className="px-4 md:px-8 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">À la une</h2>
          </div>
          <Link href={`/events/${featured.id}`} className="group block">
            <div className="relative rounded-3xl overflow-hidden h-56 md:h-72 bg-gradient-to-br from-violet-900 via-purple-900 to-rose-900 border border-violet-500/20 shadow-[0_0_40px_rgba(124,58,237,0.2)]">
              {featured.cover_image && (
                <Image
                  src={featured.cover_image}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Decorative orbs — only when no image */}
              {!featured.cover_image && (
                <>
                  <div className="absolute top-8 right-8 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-4 left-4 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl" />
                </>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-rose-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Featured
                  </span>
                  <span className="bg-white/10 border border-white/10 text-white/70 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {featured.category}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white mb-1 group-hover:text-violet-200 transition-colors">
                  {featured.title}
                </h3>
                <div className="flex items-center gap-3 text-white/60 text-xs">
                  <span>{formatDate(featured.event_date)} · {formatTime(featured.start_time)}</span>
                  {featured.venues?.name && (
                    <>
                      <span className="text-white/30">·</span>
                      <span>{featured.venues.name}</span>
                    </>
                  )}
                  <span className="ml-auto text-sm font-bold text-white/90">
                    {formatPrice(featured.price_min, featured.currency, featured.is_free)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Upcoming events */}
      <section className="px-4 md:px-8 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">Prochains événements</h2>
          <Link href="/events" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {events.slice(0, 8).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* Venues */}
      <section className="px-4 md:px-8 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">Lieux</h2>
          <Link href="/venues" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      </section>
    </div>
  )
}
