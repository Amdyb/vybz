'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import EventCard from '@/components/EventCard'
import CategoryFilter from '@/components/CategoryFilter'
import type { EventWithVenue } from '@/lib/types'

export default function EventsPage() {
  const [events, setEvents]           = useState<EventWithVenue[]>([])
  const [filtered, setFiltered]       = useState<EventWithVenue[]>([])
  const [goingCounts, setGoingCounts] = useState<Record<string, number>>({})
  const [vibeCounts, setVibeCounts]   = useState<Record<string, number>>({})
  const [category, setCategory]       = useState('Tout')
  const [loading, setLoading]         = useState(true)

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

      // Fetch going + vibe counts
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

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Événements</h1>
        <p className="text-white/40 text-sm">Dakar · Prochaines soirées</p>
      </div>

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
    </div>
  )
}
