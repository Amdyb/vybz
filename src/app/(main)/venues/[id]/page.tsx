import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import EventCard from '@/components/EventCard'
import type { Venue, EventWithVenue } from '@/lib/types'
import { VENUE_CATEGORY_COLORS } from '@/lib/utils'

export const revalidate = 60

async function getVenue(id: string): Promise<Venue | null> {
  const { data } = await supabase.from('venues').select('*').eq('id', id).single()
  return data as Venue | null
}

async function getVenueEvents(venueId: string): Promise<EventWithVenue[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(10)

  if (!data) return []
  const seen = new Set<string>()
  return (data as EventWithVenue[]).filter((e) => {
    const key = `${e.title}|${e.event_date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const VENUE_GRADIENTS: Record<string, string> = {
  'Beach Club': 'from-cyan-900 via-teal-900 to-black',
  Club:         'from-violet-900 via-purple-900 to-black',
  Rooftop:      'from-sky-900 via-blue-900 to-black',
  Lounge:       'from-amber-900 via-yellow-900 to-black',
  Restaurant:   'from-emerald-900 via-green-900 to-black',
}

export default async function VenueDetailPage({ params }: { params: { id: string } }) {
  const [venue, events] = await Promise.all([
    getVenue(params.id),
    getVenueEvents(params.id),
  ])
  if (!venue) notFound()

  const gradient = VENUE_GRADIENTS[venue.category] ?? 'from-gray-900 to-black'
  const badgeClass = VENUE_CATEGORY_COLORS[venue.category] ?? 'bg-white/10 text-white/60'

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className={`relative h-56 md:h-72 overflow-hidden ${venue.cover_image ? 'bg-black' : `bg-gradient-to-br ${gradient}`}`}>
        {venue.cover_image && (
          <Image
            src={venue.cover_image}
            alt={venue.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070f] via-black/20 to-transparent" />
        {!venue.cover_image && (
          <div className="absolute top-8 right-8 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        )}

        <Link
          href="/venues"
          className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>

        <div className="absolute bottom-6 left-4 right-4 md:left-8 z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeClass}`}>
              {venue.category}
            </span>
            {venue.is_verified && (
              <span className="flex items-center gap-1 bg-violet-600/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Vérifié
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">{venue.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6 max-w-2xl">
        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {venue.address && (
            <div className="col-span-2 bg-white/5 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Adresse</p>
                <p className="text-white text-sm font-medium">{venue.address}</p>
              </div>
            </div>
          )}
          {venue.opening_hours && (
            <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Horaires</p>
              <p className="text-white text-sm font-medium">{venue.opening_hours}</p>
            </div>
          )}
          {venue.phone && (
            <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Téléphone</p>
              <a href={`tel:${venue.phone}`} className="text-violet-400 text-sm font-medium hover:text-violet-300">
                {venue.phone}
              </a>
            </div>
          )}
          {(venue.rating ?? 0) > 0 && (
            <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Note</p>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white font-semibold text-sm">{venue.rating}</span>
                <span className="text-white/30 text-xs">({venue.review_count} avis)</span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {venue.description && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">À propos</h2>
            <p className="text-white/70 text-sm leading-relaxed">{venue.description}</p>
          </div>
        )}

        {/* Social links */}
        {(venue.instagram || venue.website) && (
          <div className="flex gap-3 mb-6">
            {venue.instagram && (
              <a
                href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 border border-white/[0.06] hover:border-violet-500/30 rounded-xl px-4 py-2.5 text-white/60 hover:text-white text-xs font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
            )}
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 border border-white/[0.06] hover:border-violet-500/30 rounded-xl px-4 py-2.5 text-white/60 hover:text-white text-xs font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Site web
              </a>
            )}
          </div>
        )}

        {/* Upcoming events at this venue */}
        {events.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
              Prochains événements ici
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
