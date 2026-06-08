'use client'

import { useEffect, useState } from 'react'
import { Ticket } from 'lucide-react'
import type { ExternalEvent } from '@/lib/types'
import ExternalEventCard from '@/components/ExternalEventCard'

type State = 'loading' | 'ready' | 'empty'

const SOURCE_LABEL: Record<ExternalEvent['source'], { name: string; color: string }> = {
  ticketmaster: { name: 'Ticketmaster', color: 'text-[#026CDF]' },
  eventbrite:   { name: 'Eventbrite',   color: 'text-[#F05537]' },
}

interface Props {
  /** API endpoint to fetch from, e.g. /api/events/ticketmaster */
  endpoint: string
  /** Row heading */
  title: string
  /** Provider — drives the "Powered by" label */
  source: ExternalEvent['source']
}

export default function ExternalEventsRow({ endpoint, title, source }: Props) {
  const [events, setEvents] = useState<ExternalEvent[]>([])
  const [state, setState]   = useState<State>('loading')

  useEffect(() => {
    let active = true

    async function load(city: string, countryCode: string) {
      try {
        const params = new URLSearchParams({ size: '12' })
        if (city) params.set('city', city)
        if (countryCode) params.set('countryCode', countryCode)
        const res = await fetch(`${endpoint}?${params.toString()}`)
        const data = (await res.json()) as { events?: ExternalEvent[] }
        if (!active) return
        const list = data.events ?? []
        setEvents(list)
        setState(list.length ? 'ready' : 'empty')
      } catch {
        if (active) setState('empty')
      }
    }

    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((geo) => load(geo.city ?? 'Dakar', geo.country_code ?? ''))
      .catch(() => load('Dakar', 'SN'))

    return () => { active = false }
  }, [endpoint])

  // Graceful fallback: render nothing if no external events for this city
  if (state === 'empty') return null

  const label = SOURCE_LABEL[source]

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-[11px] font-black text-white/80 uppercase tracking-widest flex items-center gap-1.5">
          <Ticket className={`w-3.5 h-3.5 ${label.color}`} />
          {title}
        </h2>
        <span className="text-[9px] uppercase tracking-wider text-white/25">
          Powered by <span className={`${label.color} font-bold`}>{label.name}</span>
        </span>
      </div>

      {state === 'loading' ? (
        <div className="flex gap-3 overflow-hidden pl-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-44 h-72 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pl-4 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingRight: '8px' }}
        >
          {events.map((event) => (
            <div key={event.id} className="shrink-0 w-44 snap-start">
              <ExternalEventCard event={event} />
            </div>
          ))}
          <div className="shrink-0 w-2" />
        </div>
      )}
    </section>
  )
}
