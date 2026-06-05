'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { Search, X, Star, MapPin, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EventWithVenue, Venue } from '@/lib/types'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'

// ─── Constants ───────────────────────────────────────────────────────────────

const DAKAR = { lat: 14.6937, lng: -17.4441 }
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!

const FILTERS = ['Tous', 'Nightlife', 'Jazz', 'Culture', 'Rooftop', 'Gratuit'] as const
type Filter = (typeof FILTERS)[number]

type SelectedItem =
  | { type: 'event'; data: EventWithVenue }
  | { type: 'venue'; data: Venue }
  | null

// ─── SVG pin URLs (pre-encoded, no runtime google API needed) ─────────────────

const EVENT_PIN_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 11.269 14 24 14 24S28 25.269 28 14C28 6.268 21.732 0 14 0z" fill="#a855f7"/>
    <path d="M14 1C6.82 1 1 6.82 1 14c0 10.8 13 23.1 13 23.1S27 24.8 27 14C27 6.82 21.18 1 14 1z" fill="#9333ea"/>
    <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.95"/>
  </svg>`
)}`

const VENUE_PIN_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 11.269 14 24 14 24S28 25.269 28 14C28 6.268 21.732 0 14 0z" fill="#06b6d4"/>
    <path d="M14 1C6.82 1 1 6.82 1 14c0 10.8 13 23.1 13 23.1S27 24.8 27 14C27 6.82 21.18 1 14 1z" fill="#0891b2"/>
    <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.95"/>
  </svg>`
)}`

// ─── Dark map style (VYBZ navy/purple theme) ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DARK_MAP_STYLES: any[] = [
  { elementType: 'geometry',            stylers: [{ color: '#0c0c1e' }] },
  { elementType: 'labels.icon',         stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0c0c1e' }] },
  { featureType: 'administrative',       elementType: 'geometry',           stylers: [{ color: '#1a1a3e' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'administrative.land_parcel',                              stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c4b5fd' }] },
  { featureType: 'poi',                  stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park',             elementType: 'geometry',           stylers: [{ color: '#0d1a10' }] },
  { featureType: 'poi.park',             elementType: 'labels.text.fill',   stylers: [{ color: '#4ade80' }] },
  { featureType: 'poi.park',                                                 stylers: [{ visibility: 'on' }] },
  { featureType: 'road',                 elementType: 'geometry.fill',      stylers: [{ color: '#1e1b4b' }] },
  { featureType: 'road',                 elementType: 'geometry.stroke',    stylers: [{ color: '#0c0c1e' }] },
  { featureType: 'road',                 elementType: 'labels.text.fill',   stylers: [{ color: '#a78bfa' }] },
  { featureType: 'road.arterial',        elementType: 'geometry',           stylers: [{ color: '#25255a' }] },
  { featureType: 'road.highway',         elementType: 'geometry',           stylers: [{ color: '#312e81' }] },
  { featureType: 'road.highway',         elementType: 'geometry.stroke',    stylers: [{ color: '#1e1b4b' }] },
  { featureType: 'road.highway',         elementType: 'labels.text.fill',   stylers: [{ color: '#c4b5fd' }] },
  { featureType: 'road.local',           elementType: 'labels',             stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',                                                  stylers: [{ visibility: 'off' }] },
  { featureType: 'water',                elementType: 'geometry',           stylers: [{ color: '#0a1628' }] },
  { featureType: 'water',                elementType: 'labels.text.fill',   stylers: [{ color: '#1e40af' }] },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const [events, setEvents] = useState<EventWithVenue[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<Filter>('Tous')
  const [selected, setSelected] = useState<SelectedItem>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const [evRes, vRes] = await Promise.all([
        supabase
          .from('events')
          .select('*, venues(*)')
          .eq('status', 'published')
          .gte('event_date', today)
          .limit(200),
        supabase
          .from('venues')
          .select('*')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(200),
      ])
      if (evRes.data)  setEvents(evRes.data as EventWithVenue[])
      if (vRes.data)   setVenues(vRes.data as Venue[])
      setLoading(false)
    }
    load()
  }, [])

  const filteredEvents = useMemo(() => events.filter(e => {
    if (!e.venues?.latitude || !e.venues?.longitude) return false
    if (search) {
      const s = search.toLowerCase()
      if (!e.title.toLowerCase().includes(s) && !e.category.toLowerCase().includes(s)) return false
    }
    if (filter === 'Gratuit') return e.is_free === true
    if (filter !== 'Tous')   return e.category === filter
    return true
  }), [events, search, filter])

  const filteredVenues = useMemo(() => venues.filter(v => {
    if (!v.latitude || !v.longitude) return false
    if (filter === 'Gratuit') return false
    if (search) {
      const s = search.toLowerCase()
      if (!v.name.toLowerCase().includes(s) && !v.category.toLowerCase().includes(s)) return false
    }
    if (filter === 'Rooftop') return v.category === 'Rooftop'
    if (filter !== 'Tous')    return false // venues only shown for broad filters
    return true
  }), [venues, search, filter])

  return (
    <div className="relative h-full bg-[#08080F]">
      {/* ── Map ── */}
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={DAKAR}
          defaultZoom={13}
          disableDefaultUI
          gestureHandling="greedy"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          styles={DARK_MAP_STYLES as any}
          style={{ width: '100%', height: '100%' }}
          onClick={() => setSelected(null)}
        >
          <MapPins
            events={filteredEvents}
            venues={filteredVenues}
            onSelect={setSelected}
          />
        </Map>
      </APIProvider>

      {/* ── Search + filter overlay ── */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 space-y-2 pointer-events-none">
        {/* Search bar */}
        <div className="relative pointer-events-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un événement ou lieu…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900/95 backdrop-blur border border-purple-900/30 rounded-xl pl-10 pr-10 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 shadow-xl"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pointer-events-auto pb-0.5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-lg ${
                filter === f
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                  : 'bg-zinc-900/95 backdrop-blur border border-purple-900/30 text-zinc-400 hover:text-white hover:border-purple-500/40'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pin legend ── */}
      <div className="absolute top-0 right-0 z-10 p-3 pointer-events-none">
        <div className="bg-zinc-900/95 backdrop-blur border border-purple-900/30 rounded-xl px-3 py-2 space-y-1 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <span className="text-[10px] text-zinc-400">Événements</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
            <span className="text-[10px] text-zinc-400">Lieux</span>
          </div>
        </div>
      </div>

      {/* ── Loading indicator ── */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#08080F]/80 backdrop-blur-sm pointer-events-none">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      {/* ── Bottom info card ── */}
      {selected && (
        <BottomCard item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// ─── MapPins — renders inside <Map>, uses useMap() ────────────────────────────

interface MapPinsProps {
  events: EventWithVenue[]
  venues: Venue[]
  onSelect: (item: SelectedItem) => void
}

function MapPins({ events, venues, onSelect }: MapPinsProps) {
  const map = useMap()
  const eventMarkersRef = useRef<google.maps.Marker[]>([])
  const venueMarkersRef = useRef<google.maps.Marker[]>([])

  // Event markers
  useEffect(() => {
    if (!map) return

    eventMarkersRef.current.forEach(m => {
      google.maps.event.clearInstanceListeners(m)
      m.setMap(null)
    })
    eventMarkersRef.current = []

    events.forEach(event => {
      const lat = event.venues?.latitude
      const lng = event.venues?.longitude
      if (!lat || !lng) return

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          url: EVENT_PIN_URL,
          scaledSize: new google.maps.Size(28, 38),
          anchor: new google.maps.Point(14, 38),
        },
        title: event.title,
        optimized: true,
      })
      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        e.stop?.()
        onSelect({ type: 'event', data: event })
      })
      eventMarkersRef.current.push(marker)
    })

    return () => {
      eventMarkersRef.current.forEach(m => {
        google.maps.event.clearInstanceListeners(m)
        m.setMap(null)
      })
    }
  }, [map, events, onSelect])

  // Venue markers
  useEffect(() => {
    if (!map) return

    venueMarkersRef.current.forEach(m => {
      google.maps.event.clearInstanceListeners(m)
      m.setMap(null)
    })
    venueMarkersRef.current = []

    venues.forEach(venue => {
      if (!venue.latitude || !venue.longitude) return

      const marker = new google.maps.Marker({
        position: { lat: venue.latitude, lng: venue.longitude },
        map,
        icon: {
          url: VENUE_PIN_URL,
          scaledSize: new google.maps.Size(28, 38),
          anchor: new google.maps.Point(14, 38),
        },
        title: venue.name,
        optimized: true,
      })
      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        e.stop?.()
        onSelect({ type: 'venue', data: venue })
      })
      venueMarkersRef.current.push(marker)
    })

    return () => {
      venueMarkersRef.current.forEach(m => {
        google.maps.event.clearInstanceListeners(m)
        m.setMap(null)
      })
    }
  }, [map, venues, onSelect])

  return null
}

// ─── BottomCard ───────────────────────────────────────────────────────────────

function BottomCard({ item, onClose }: { item: NonNullable<SelectedItem>; onClose: () => void }) {
  const isEvent = item.type === 'event'

  const name      = isEvent ? (item.data as EventWithVenue).title : (item.data as Venue).name
  const category  = item.data.category
  const image     = item.data.cover_image
  const href      = isEvent ? `/events/${item.data.id}` : `/venues/${item.data.id}`

  const event  = isEvent ? (item.data as EventWithVenue) : null
  const venue  = !isEvent ? (item.data as Venue) : null

  return (
    /* pb-24 on mobile clears the fixed bottom nav; md:pb-3 on desktop */
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-24 md:pb-3 animate-in slide-in-from-bottom duration-200">
      <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl overflow-hidden shadow-2xl max-w-lg mx-auto">

        {/* Cover image */}
        {image ? (
          <div className="relative h-36">
            <Image src={image} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 512px" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
          </div>
        ) : (
          <div className={`h-1.5 bg-gradient-to-r ${isEvent ? 'from-purple-600 to-purple-400' : 'from-cyan-600 to-cyan-400'}`} />
        )}

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Type + category badge */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isEvent ? 'text-purple-400' : 'text-cyan-400'}`}>
                  {isEvent ? 'Événement' : 'Lieu'}
                </span>
                <span className="text-white/20">·</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{category}</span>
              </div>

              {/* Name */}
              <h3 className="font-bold text-white text-base leading-tight line-clamp-1">{name}</h3>

              {/* Event: date + time */}
              {event && (
                <p className="text-zinc-400 text-xs mt-0.5">
                  {formatDate(event.event_date)} · {formatTime(event.start_time)}
                </p>
              )}

              {/* Venue: address or rating */}
              {venue && venue.address && (
                <p className="text-zinc-400 text-xs mt-0.5 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {venue.address}
                </p>
              )}
              {venue && (venue.rating ?? 0) > 0 && (
                <p className="text-zinc-400 text-xs mt-0.5 flex items-center gap-1">
                  <Star className="w-3 h-3 shrink-0 text-amber-400" />
                  <span className="text-amber-400">{venue.rating}</span>
                  {venue.review_count ? <span className="text-zinc-500">({venue.review_count} avis)</span> : null}
                </p>
              )}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors p-1 -mr-1 -mt-1 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-sm font-semibold">
              {event && (
                <span className={event.is_free ? 'text-cyan-400' : 'text-amber-400'}>
                  {formatPrice(event.price_min, event.currency, event.is_free)}
                </span>
              )}
            </span>
            <Link
              href={href}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold px-5 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all"
            >
              Voir les détails
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
