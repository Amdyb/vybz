'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Shuffle, X, MapPin, CalendarDays, Clock, Navigation,
  Ticket, ThumbsDown, Loader2, Sparkles, Flame, Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EventWithVenue, UserPreferences } from '@/lib/types'
import { formatDate, formatTime, formatPrice, getVibe } from '@/lib/utils'
import { useLocation } from '@/components/LocationProvider'

// ── Tuning ──────────────────────────────────────────────────────────────────
const MAX_DISMISS  = 5      // "Pas pour moi" taps before "Aucun événement trouvé ce soir"
const RADIUS_KM    = 50     // hard cap — only surprise within 50 km when location is known
const HORIZON_DAYS = 14     // fall back to upcoming events when nothing is on tonight

type Coords = { lat: number; lng: number }
type Scored = { event: EventWithVenue; score: number; distanceKm: number | null; vibe: number }

// Map raw event categories onto the 5 onboarding vibe tags (USER_CATEGORIES).
const VIBE_SYNONYMS: Record<string, string> = {
  club: 'Nightlife', lounge: 'Nightlife', 'beach party': 'Nightlife',
  festival: 'Nightlife', afterwork: 'Nightlife', soirée: 'Nightlife',
  rooftop: 'Rooftop',
  jazz: 'Jazz', 'live music': 'Jazz', concert: 'Jazz', afrobeats: 'Jazz', 'dj set': 'Jazz',
  culture: 'Culture', art: 'Culture', exhibition: 'Culture', cinema: 'Culture',
  theatre: 'Culture', comedy: 'Culture', cultural: 'Culture',
  underground: 'Underground',
}

// ── Geo helpers ───────────────────────────────────────────────────────────────

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Browser geolocation first (accurate), IP geolocation as fallback. Cached in localStorage. */
async function getUserCoords(): Promise<Coords | null> {
  try {
    const c = localStorage.getItem('vybz-coords')
    if (c) { const p = JSON.parse(c); if (p && typeof p.lat === 'number') return p }
  } catch {}

  const fromBrowser = await new Promise<Coords | null>((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    const t = setTimeout(() => resolve(null), 5000)
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(t); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
      () => { clearTimeout(t); resolve(null) },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 },
    )
  })

  let coords = fromBrowser
  if (!coords) {
    try {
      const geo = await fetch('https://ipapi.co/json/').then((r) => r.json())
      if (geo.latitude && geo.longitude) coords = { lat: geo.latitude, lng: geo.longitude }
    } catch {}
  }
  if (coords) { try { localStorage.setItem('vybz-coords', JSON.stringify(coords)) } catch {} }
  return coords
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

// Fisher–Yates on the first `n` entries only (randomise the top picks on a tie).
function shuffleTop<T>(arr: T[], n: number): T[] {
  const out = [...arr]
  const top = Math.min(n, out.length)
  for (let i = top - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SurpriseOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { activeCity } = useLocation()

  // Enter / exit animation
  const [render, setRender] = useState(false)
  const [show, setShow]     = useState(false)

  const [status, setStatus]       = useState<'loading' | 'ready' | 'empty'>('loading')
  const [pool, setPool]           = useState<Scored[]>([])
  const [index, setIndex]         = useState(0)
  const [dismissed, setDismissed] = useState(0)
  const userIdRef = useRef<string | null>(null)

  // ── Score every candidate against the user's vibe, timing, distance & buzz ──
  const load = useCallback(async () => {
    setStatus('loading')
    setIndex(0)
    setDismissed(0)

    const today = new Date().toISOString().split('T')[0]
    const horizon = new Date(Date.now() + HORIZON_DAYS * 86400000).toISOString().split('T')[0]

    const [{ data: { session } }, coords, evRes] = await Promise.all([
      supabase.auth.getSession(),
      getUserCoords(),
      supabase
        .from('events')
        .select('*, venues(*)')
        .eq('status', 'published')
        .gte('event_date', today)
        .lte('event_date', horizon)
        .order('event_date', { ascending: true })
        .limit(200),
    ])

    userIdRef.current = session?.user?.id ?? null

    // User preferences (vibe tags + budget)
    let favCats: string[] = []
    let prefersFree = false
    if (session?.user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('favorite_categories, user_preferences')
        .eq('id', session.user.id)
        .maybeSingle()
      const p = prof as { favorite_categories: string[] | null; user_preferences: UserPreferences | null } | null
      favCats = p?.favorite_categories ?? []
      // `budget` isn't captured in onboarding yet — read it defensively so the
      // +15 free-event bonus lights up automatically once that preference exists.
      prefersFree = (p?.user_preferences as { budget?: string } | null)?.budget === 'gratuit'
    }
    const favLower = favCats.map((c) => c.toLowerCase())

    const events = (evRes.data ?? []) as EventWithVenue[]
    if (!events.length) { setPool([]); setStatus('empty'); return }

    // Live buzz (Vibe Meter) + ticket availability, in parallel
    const ids = events.map((e) => e.id)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const [vibeRes, tickRes] = await Promise.all([
      supabase.from('checkins').select('event_id')
        .not('event_id', 'is', null).gte('created_at', twoHoursAgo)
        .in('event_id', ids).in('visibility', ['public', 'followers']),
      supabase.from('ticket_types').select('event_id, quantity, quantity_sold').in('event_id', ids),
    ])

    const vibeCounts: Record<string, number> = {}
    for (const r of (vibeRes.data ?? []) as { event_id: string }[]) {
      if (r.event_id) vibeCounts[r.event_id] = (vibeCounts[r.event_id] ?? 0) + 1
    }
    const ticketsAvail = new Set<string>()
    for (const t of (tickRes.data ?? []) as { event_id: string; quantity: number; quantity_sold: number | null }[]) {
      if ((t.quantity ?? 0) - (t.quantity_sold ?? 0) > 0) ticketsAvail.add(t.event_id)
    }

    const scored: Scored[] = events.map((e) => {
      let s = 0
      const cat = (e.category ?? '').toLowerCase()
      const synonym = VIBE_SYNONYMS[cat]?.toLowerCase()
      const vibeMatch = favLower.includes(cat) || (synonym ? favLower.includes(synonym) : false)
      if (vibeMatch) s += 30                              // matches a vibe from onboarding
      if (e.event_date === today) s += 20                 // happening tonight
      if (e.is_free && prefersFree) s += 15               // free + user prefers gratuit

      let distanceKm: number | null = null
      if (coords && e.venues?.latitude != null && e.venues?.longitude != null) {
        distanceKm = haversineKm(coords, { lat: e.venues.latitude, lng: e.venues.longitude })
        if (distanceKm <= 5) s += 20                      // within 5 km
        else if (distanceKm <= 20) s += 10                // within 20 km
      }

      const vibe = vibeCounts[e.id] ?? 0
      if (vibe >= 10) s += 15                              // high check-in count (Vibe Meter)
      else if (vibe >= 4) s += 7

      if (e.is_featured) s += 10                           // featured
      if (ticketsAvail.has(e.id)) s += 10                  // tickets still available
      if (e.cover_image) s += 1                            // tiny tiebreaker — looks good

      return { event: e, score: s, distanceKm, vibe }
    })

    // Hard 50 km cap when we know where the user is; otherwise prefer their city.
    let candidates = scored.filter((c) => c.distanceKm === null || c.distanceKm <= RADIUS_KM)
    if (!coords && activeCity) {
      const inCity = candidates.filter((c) => c.event.city?.toLowerCase() === activeCity.toLowerCase())
      if (inCity.length) candidates = inCity
    }

    candidates.sort((a, b) => b.score - a.score)
    // Pick highest scoring; on a tie, randomise between the top 3.
    const ordered = shuffleTop(candidates, 3)

    setPool(ordered)
    setStatus(ordered.length ? 'ready' : 'empty')
  }, [activeCity])

  // Mount / unmount with slide animation; load fresh each time it opens.
  useEffect(() => {
    if (open) {
      setRender(true)
      const raf = requestAnimationFrame(() => setShow(true))
      load()
      return () => cancelAnimationFrame(raf)
    }
    if (render) {
      setShow(false)
      const t = setTimeout(() => setRender(false), 300)
      return () => clearTimeout(t)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    const next = dismissed + 1
    setDismissed(next)
    if (next >= MAX_DISMISS || index + 1 >= pool.length) { setStatus('empty'); return }
    setIndex(index + 1)
  }, [dismissed, index, pool.length])

  const goToEvent = useCallback(() => {
    const cur = pool[index]
    if (!cur) return
    const ev = cur.event
    const uid = userIdRef.current
    if (uid) {
      // +5 Pulse Points and an activity-feed entry — best-effort, never blocks navigation.
      supabase.from('pulse_points_transactions').insert({
        user_id: uid, points: 5, action: 'surprise_me',
        description: `Surprise Me : ${ev.title}`,
      } as never).then(() => {})
      supabase.from('activity_feed').insert({
        user_id: uid, action_type: 'recommendation',
        target_id: ev.id, target_type: 'event',
        metadata: { event_title: ev.title, event_date: ev.event_date },
        is_public: true,
      } as never).then(() => {})
    }
    onClose()
    router.push(`/events/${ev.id}`)
  }, [pool, index, onClose, router])

  if (!render) return null

  const current = pool[index]
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-md mx-auto bg-[#0c0c16] border-t border-fuchsia-500/20 rounded-t-3xl shadow-2xl max-h-[94dvh] flex flex-col transition-transform duration-300 ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Grab handle + header */}
        <div className="shrink-0 px-5 pt-3 pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full bg-white/15" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center">
                <Shuffle className="w-3.5 h-3.5 text-white" />
              </span>
              <h2 className="text-white font-black text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                Surprise Me
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {status === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
              <p className="text-white/50 text-sm font-semibold">On cherche ton vibe…</p>
            </div>
          ) : status === 'empty' || !current ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-fuchsia-400/40" />
              </div>
              <p className="text-white font-bold text-base mb-1">Aucun événement trouvé ce soir</p>
              <p className="text-white/40 text-sm mb-6">Reviens plus tard ou explore tous les plans.</p>
              <button
                onClick={() => { onClose(); router.push('/events') }}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-bold active:scale-95 transition-transform"
              >
                Voir tous les événements
              </button>
            </div>
          ) : (
            <ResultCard
              scored={current}
              isTonight={current.event.event_date === today}
              onGo={goToEvent}
              onSkip={dismiss}
              remaining={MAX_DISMISS - dismissed}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Result card ────────────────────────────────────────────────────────────────

function ResultCard({
  scored, isTonight, onGo, onSkip, remaining,
}: {
  scored: Scored
  isTonight: boolean
  onGo: () => void
  onSkip: () => void
  remaining: number
}) {
  const ev = scored.event
  const vibe = getVibe(scored.vibe, true)

  return (
    <div className="animate-[surpriseIn_0.35s_ease]">
      {/* Cover */}
      <div className="relative w-full aspect-[4/5] rounded-[1.75rem] overflow-hidden border border-purple-900/40 bg-zinc-900">
        {ev.cover_image ? (
          <Image src={ev.cover_image} alt={ev.title} fill className="object-cover" sizes="(max-width: 768px) 90vw, 420px" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/60 to-cyan-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {isTonight && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-fuchsia-500 text-white">
              Ce soir
            </span>
          )}
          {vibe && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${vibe.color} ${vibe.bg}`}>
              <Flame className="w-2.5 h-2.5" />
              {vibe.label}
            </span>
          )}
        </div>
        {ev.is_featured && (
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400 text-black">
            À la une
          </span>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10 mb-2">
            {ev.category}
          </span>
          <h3 className="text-white font-black text-xl leading-tight mb-2 line-clamp-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            {ev.title}
          </h3>

          <div className="space-y-1 text-white/75 text-xs">
            {ev.venues?.name && (
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3 h-3 shrink-0 text-fuchsia-400" />
                <span className="truncate">{ev.venues.name}</span>
                {scored.distanceKm != null && (
                  <span className="flex items-center gap-0.5 text-white/45 shrink-0">
                    <Navigation className="w-2.5 h-2.5" />
                    {formatDistance(scored.distanceKm)}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3 shrink-0 text-fuchsia-400" />
                {formatDate(ev.event_date)}
              </span>
              {ev.start_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 shrink-0 text-fuchsia-400" />
                  {formatTime(ev.start_time)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className={`font-black text-base ${ev.is_free ? 'text-cyan-400' : 'text-amber-400'}`}>
              {formatPrice(ev.price_min, ev.currency, ev.is_free) || '—'}
            </span>
            {scored.vibe > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-fuchsia-400/80 font-medium">
                <Users className="w-3 h-3" />
                {scored.vibe} sur place
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-4 space-y-2.5">
        <button
          onClick={onGo}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-4 rounded-2xl text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)]"
        >
          <Ticket className="w-4 h-4" />
          Je veux y aller
        </button>
        <button
          onClick={onSkip}
          className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/75 font-bold py-3.5 rounded-2xl text-sm hover:bg-white/10 active:scale-[0.98] transition-all"
        >
          <ThumbsDown className="w-4 h-4" />
          Pas pour moi
        </button>
        <p className="text-center text-white/25 text-[11px] pt-0.5">
          {remaining > 0
            ? `Encore ${remaining} surprise${remaining > 1 ? 's' : ''}`
            : 'Dernière surprise'}
        </p>
      </div>
    </div>
  )
}
