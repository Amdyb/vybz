'use client'

import { useEffect, useState } from 'react'
import { Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import EventCard from '@/components/EventCard'
import ExternalEventCard from '@/components/ExternalEventCard'
import CategoryFilter from '@/components/CategoryFilter'
import type { EventWithVenue, ExternalEvent } from '@/lib/types'
import { useLocation } from '@/components/LocationProvider'

type Tab = 'vybz' | 'externes'

export default function EventsPage() {
  const [tab, setTab]                 = useState<Tab>('vybz')
  const [events, setEvents]           = useState<EventWithVenue[]>([])
  const [filtered, setFiltered]       = useState<EventWithVenue[]>([])
  const [goingCounts, setGoingCounts] = useState<Record<string, number>>({})
  const [vibeCounts, setVibeCounts]   = useState<Record<string, number>>({})
  const [category, setCategory]       = useState('Tout')
  const [loading, setLoading]         = useState(true)

  // External (Ticketmaster) state
  const [external, setExternal]       = useState<ExternalEvent[]>([])
  const [extLoading, setExtLoading]   = useState(false)
  const { activeCity, activeCountry } = useLocation()

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('events')
        .select('*, venues(*)')
        .eq('status', 'published')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(200)

      if (!data) { setLoading(false); return }

      const seen = new Set<string>()
      const deduped = (data as EventWithVenue[]).filter((e) => {
        const key = `${e.title}|${e.event_date}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      setEvents(deduped)
      setFiltered(deduped)

      if (deduped.length) {
        const ids = deduped.map((e) => e.id)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

        const [goingRes, vibeRes] = await Promise.all([
          supabase.from('event_attendance').select('event_id').eq('status', 'going').in('event_id', ids),
          supabase.from('checkins').select('event_id').not('event_id', 'is', null).gte('created_at', twoHoursAgo).in('event_id', ids).in('visibility', ['public', 'followers']),
        ])

        const going: Record<string, number> = {}
        for (const r of (goingRes.data ?? []) as { event_id: string }[]) {
          going[r.event_id] = (going[r.event_id] ?? 0) + 1
        }
        setGoingCounts(going)

        const vibe: Record<string, number> = {}
        for (const r of (vibeRes.data ?? []) as { event_id: string }[]) {
          if (r.event_id) vibe[r.event_id] = (vibe[r.event_id] ?? 0) + 1
        }
        setVibeCounts(vibe)
      }

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setFiltered(category === 'Tout' ? events : events.filter((e) => e.category === category))
  }, [category, events])

  // Lazy-load external events when the Externes tab is open (and refetch on city change)
  useEffect(() => {
    if (tab !== 'externes') return
    setExtLoading(true)

    async function fetchExternal(city: string, countryCode: string) {
      const params = new URLSearchParams({ size: '40' })
      if (city) params.set('city', city)
      if (countryCode) params.set('countryCode', countryCode)

      try {
        // Fetch both providers in parallel; each fails soft to an empty list
        const [tmRes, ebRes] = await Promise.all([
          fetch(`/api/events/ticketmaster?${params.toString()}`).then((r) => r.json()).catch(() => ({ events: [] })),
          fetch(`/api/events/eventbrite?${params.toString()}`).then((r) => r.json()).catch(() => ({ events: [] })),
        ]) as { events?: ExternalEvent[] }[]

        // Merge and sort by date (events without a date sink to the end)
        const merged = [...(tmRes.events ?? []), ...(ebRes.events ?? [])]
        merged.sort((a, b) => (a.event_date || '9999').localeCompare(b.event_date || '9999'))
        setExternal(merged)
      } catch {
        setExternal([])
      } finally {
        setExtLoading(false)
      }
    }

    fetchExternal(activeCity || 'Dakar', activeCountry)
  }, [tab, activeCity, activeCountry])

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white mb-1">Événements</h1>
        <p className="text-white/40 text-sm">Dakar · Prochaines soirées</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('vybz')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
            tab === 'vybz'
              ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-[0_0_14px_rgba(217,70,239,0.4)]'
              : 'bg-zinc-900 border border-purple-900/30 text-white/50 hover:text-white/80'
          }`}
        >
          VYBZ
        </button>
        <button
          onClick={() => setTab('externes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
            tab === 'externes'
              ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-[0_0_14px_rgba(217,70,239,0.4)]'
              : 'bg-zinc-900 border border-purple-900/30 text-white/50 hover:text-white/80'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Externes
        </button>
      </div>

      {/* ── VYBZ tab ── */}
      {tab === 'vybz' && (
        <>
          <div className="mb-6">
            <CategoryFilter active={category} onChange={setCategory} />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-52" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/30 text-sm">Aucun événement dans cette catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  goingCount={goingCounts[event.id]}
                  vibeCount={vibeCounts[event.id]}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Externes (Ticketmaster) tab ── */}
      {tab === 'externes' && (
        <>
          <div className="flex items-center justify-between mb-4 gap-2">
            <p className="text-white/40 text-sm">Événements près de chez vous</p>
            <span className="text-[10px] uppercase tracking-wider text-white/25 shrink-0">
              Via <span className="text-[#026CDF] font-bold">Ticketmaster</span>
              {' · '}
              <span className="text-[#F05537] font-bold">Eventbrite</span>
            </span>
          </div>

          {extLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-72" />
              ))}
            </div>
          ) : external.length === 0 ? (
            <div className="text-center py-20">
              <Ticket className="w-8 h-8 text-white/15 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Aucun événement externe pour cette ville</p>
              <p className="text-white/20 text-xs mt-1">Essayez plus tard ou changez de ville</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {external.map((event) => (
                <ExternalEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
