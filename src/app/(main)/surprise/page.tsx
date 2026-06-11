'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles, MapPin, Clock, Calendar, Users, ArrowRight, RotateCw, Loader2, Ticket,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { EventWithVenue } from '@/lib/types'
import { formatDate, formatTime, formatPrice, getVibe } from '@/lib/utils'

type Phase = 'idle' | 'rolling' | 'result'

/** How many top-scored events form the pool we randomly surprise from. */
const TOP_POOL = 8

export default function SurprisePage() {
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [city, setCity]         = useState('')
  const [events, setEvents]     = useState<EventWithVenue[]>([])
  const [goingCounts, setGoingCounts] = useState<Record<string, number>>({})
  const [vibeCounts, setVibeCounts]   = useState<Record<string, number>>({})

  const [phase, setPhase]       = useState<Phase>('idle')
  const [tickEvent, setTickEvent] = useState<EventWithVenue | null>(null) // shown during the roll
  const [pick, setPick]         = useState<EventWithVenue | null>(null)
  const lastPickId = useRef<string | null>(null)
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // ── Load upcoming events + social signals + city ──────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('events')
        .select('*, venues(*)')
        .eq('status', 'published')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(150)

      const list = (data ?? []) as EventWithVenue[]
      setEvents(list)

      if (list.length) {
        const ids = list.map((e) => e.id)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        const [goingRes, vibeRes] = await Promise.all([
          supabase.from('event_attendance').select('event_id').eq('status', 'going').in('event_id', ids),
          supabase.from('checkins').select('event_id').not('event_id', 'is', null).gte('created_at', twoHoursAgo).in('event_id', ids).in('visibility', ['public', 'followers']),
        ])
        const going: Record<string, number> = {}
        for (const r of (goingRes.data ?? []) as { event_id: string }[]) going[r.event_id] = (going[r.event_id] ?? 0) + 1
        setGoingCounts(going)
        const vibe: Record<string, number> = {}
        for (const r of (vibeRes.data ?? []) as { event_id: string }[]) if (r.event_id) vibe[r.event_id] = (vibe[r.event_id] ?? 0) + 1
        setVibeCounts(vibe)
      }
      setLoading(false)
    }
    load()

    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((d) => { if (d.city) setCity(d.city) })
      .catch(() => {})
  }, [today])

  useEffect(() => () => { if (rollTimer.current) clearInterval(rollTimer.current) }, [])

  // ── "Best near you right now" score ───────────────────────────────────────
  const scoreOf = useCallback((e: EventWithVenue): number => {
    let s = 0
    if (e.event_date === today) s += 5                                   // tonight
    if (e.is_featured) s += 4                                            // curated
    s += Math.min(goingCounts[e.id] ?? 0, 12) * 0.5                      // popularity (≤ +6)
    s += Math.min(vibeCounts[e.id] ?? 0, 12) * 0.7                       // live buzz (≤ +8.4)
    if (e.cover_image) s += 2                                            // looks good
    const days = Math.max(0, (new Date(e.event_date + 'T00:00:00').getTime() - Date.now()) / 86400000)
    s += Math.max(0, 5 - days * 0.3)                                     // sooner is better
    return s
  }, [today, goingCounts, vibeCounts])

  // Candidate pool: prefer events in the user's city; fall back to everything.
  const candidates = (() => {
    if (!events.length) return []
    const inCity = city
      ? events.filter((e) => e.city?.toLowerCase() === city.toLowerCase())
      : []
    const pool = inCity.length ? inCity : events
    return [...pool].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, TOP_POOL)
  })()

  const usingCityPool = !!city && events.some((e) => e.city?.toLowerCase() === city.toLowerCase())

  // ── The surprise roll ─────────────────────────────────────────────────────
  const surprise = useCallback(() => {
    if (!candidates.length) return
    // Pick from the top pool, avoiding an immediate repeat.
    const choices = candidates.filter((e) => e.id !== lastPickId.current)
    const chosen = (choices.length ? choices : candidates)[Math.floor(Math.random() * (choices.length ? choices.length : candidates.length))]

    setPhase('rolling')
    setPick(null)
    let elapsed = 0
    if (rollTimer.current) clearInterval(rollTimer.current)
    rollTimer.current = setInterval(() => {
      setTickEvent(candidates[Math.floor(Math.random() * candidates.length)])
      elapsed += 90
      if (elapsed >= 1350) {
        if (rollTimer.current) clearInterval(rollTimer.current)
        lastPickId.current = chosen.id
        setPick(chosen)
        setPhase('result')
      }
    }, 90)
  }, [candidates])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
      </div>
    )
  }

  const hasEvents = candidates.length > 0

  return (
    <div className="min-h-[80vh] px-5 py-8 flex flex-col items-center">
      <div className="w-full max-w-md flex-1 flex flex-col items-center">

        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20 border border-fuchsia-500/30 mb-4">
            <Sparkles className="w-6 h-6 text-fuchsia-300" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            Surprise Me
          </h1>
          <p className="text-zinc-400 text-sm">
            Un tap, le meilleur plan {usingCityPool ? <>à <span className="text-white/80 font-semibold">{city}</span></> : 'près de toi'} maintenant.
          </p>
        </div>

        {/* ── Empty state ── */}
        {!hasEvents && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <p className="text-white/40 text-sm mb-4">Aucun événement à proximité pour le moment.</p>
            <Link href="/events" className="text-fuchsia-400 text-sm font-semibold hover:text-fuchsia-300 transition-colors">
              Voir tous les événements
            </Link>
          </div>
        )}

        {/* ── Idle: the big button ── */}
        {hasEvents && phase === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <button
              onClick={surprise}
              className="group relative w-52 h-52 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex flex-col items-center justify-center text-white shadow-[0_0_50px_rgba(217,70,239,0.4)] hover:shadow-[0_0_70px_rgba(217,70,239,0.6)] active:scale-95 transition-all duration-300"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 animate-ping opacity-20" />
              <Sparkles className="w-10 h-10 mb-2 group-hover:rotate-12 transition-transform" />
              <span className="font-black text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Surprends-moi</span>
            </button>
            <p className="text-zinc-600 text-xs mt-8">{candidates.length} plans triés sur le volet</p>
          </div>
        )}

        {/* ── Rolling: slot-machine reveal ── */}
        {hasEvents && phase === 'rolling' && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="relative w-full aspect-[4/5] max-w-xs rounded-[2rem] overflow-hidden border border-fuchsia-500/30 bg-zinc-900">
              {tickEvent?.cover_image && (
                <Image src={tickEvent.cover_image} alt="" fill className="object-cover opacity-80 blur-[1px]" sizes="320px" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RotateCw className="w-8 h-8 text-white animate-spin" />
                  <span className="text-white/80 text-sm font-semibold animate-pulse">On cherche ton vibe…</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Result: the chosen event ── */}
        {hasEvents && phase === 'result' && pick && (
          <div className="flex-1 flex flex-col items-center justify-center w-full animate-[fadeIn_0.4s_ease]">
            <Link href={`/events/${pick.id}`} className="block w-full max-w-xs group">
              <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden border border-purple-900/40 bg-zinc-900 group-hover:border-fuchsia-500/40 transition-all">
                {pick.cover_image ? (
                  <Image src={pick.cover_image} alt={pick.title} fill className="object-cover" sizes="320px" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/50 to-purple-900/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Tonight + vibe badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {pick.event_date === today && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-fuchsia-500 text-white">Ce soir</span>
                  )}
                  {(() => { const v = getVibe(vibeCounts[pick.id] ?? 0); return v && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${v.color} ${v.bg}`}>{v.label}</span>
                  ) })()}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10 mb-2">
                    {pick.category}
                  </span>
                  <h2 className="text-white font-black text-xl leading-tight mb-2 line-clamp-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {pick.title}
                  </h2>
                  <div className="space-y-1 text-white/70 text-xs">
                    {pick.venues?.name && (
                      <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0 text-fuchsia-400" />{pick.venues.name}</div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 shrink-0 text-fuchsia-400" />{formatDate(pick.event_date)}</span>
                      {pick.start_time && <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 shrink-0 text-fuchsia-400" />{formatTime(pick.start_time)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`font-bold text-sm ${pick.is_free ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {formatPrice(pick.price_min, pick.currency, pick.is_free) || '—'}
                    </span>
                    {(goingCounts[pick.id] ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-fuchsia-400/70 font-medium">
                        <Users className="w-3 h-3" />{goingCounts[pick.id]} intéressés
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* CTAs */}
            <div className="w-full max-w-xs mt-5 space-y-2.5">
              <button
                onClick={() => router.push(`/events/${pick.id}`)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Ticket className="w-4 h-4" /> Voir l&apos;événement
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={surprise}
                className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/80 font-bold py-3.5 rounded-full text-sm hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <RotateCw className="w-4 h-4" /> Encore une surprise
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
