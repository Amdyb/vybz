'use client'

import Image from 'next/image'
import { MapPin, ExternalLink, Ticket } from 'lucide-react'
import type { ExternalEvent } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const CATEGORY_BADGE: Record<string, string> = {
  'Concerts & Live Music': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Culture & Art':         'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Wellness & Outdoor':    'bg-lime-500/20 text-lime-300 border-lime-500/30',
  Experiences:             'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

function formatExternalPrice(ev: ExternalEvent): string {
  if (ev.is_free) return 'Gratuit'
  if (ev.price_min == null) return 'Voir prix'
  return `dès ${ev.price_min.toLocaleString('fr-FR')} ${ev.currency ?? ''}`.trim()
}

const SOURCE_META: Record<ExternalEvent['source'], { label: string; color: string }> = {
  ticketmaster: { label: 'Ticketmaster', color: 'text-[#026CDF]' },
  eventbrite:   { label: 'Eventbrite',   color: 'text-[#F05537]' },
  facebook:     { label: 'Facebook',     color: 'text-[#1877F2]' },
}

export default function ExternalEventCard({ event }: { event: ExternalEvent }) {
  const badgeClass = CATEGORY_BADGE[event.category] ?? 'bg-white/10 text-white/60 border-white/10'
  const price = formatExternalPrice(event)
  const source = SOURCE_META[event.source]

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full h-full"
    >
      <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-purple-900/30 group-hover:border-fuchsia-500/30 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.12)] group-hover:-translate-y-0.5 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 shrink-0">
          {event.cover_image ? (
            <Image
              src={event.cover_image}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 240px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Ticket className="w-8 h-8 text-white/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

          {/* Date pill */}
          {event.event_date && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 text-center min-w-[32px]">
              <div className="text-[8px] text-white/50 uppercase leading-none">
                {new Date(event.event_date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
              </div>
              <div className="text-sm font-black text-white leading-tight">
                {new Date(event.event_date + 'T00:00:00').getDate()}
              </div>
            </div>
          )}

          {/* External-link affordance */}
          <span className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/60 group-hover:text-white group-hover:bg-black/70 transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Text content */}
        <div className="p-3 pt-2.5 flex flex-col flex-1">
          <span className={`inline-block self-start text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${badgeClass}`}>
            {event.category}
          </span>
          <h3 className="text-white/90 text-xs font-semibold mt-1.5 mb-1 line-clamp-2 group-hover:text-white transition-colors leading-snug">
            {event.title}
          </h3>
          {event.venue_name && (
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-2.5 h-2.5 text-white/30 shrink-0" />
              <p className="text-white/40 text-[10px] truncate">{event.venue_name}</p>
            </div>
          )}
          {event.event_date && (
            <p className="text-white/25 text-[10px] mb-2">{formatDate(event.event_date)}</p>
          )}

          <div className="mt-auto flex items-center justify-between gap-1">
            <span className={`text-xs font-bold ${event.is_free ? 'text-cyan-400' : 'text-amber-400'}`}>
              {price}
            </span>
          </div>

          {/* Source label */}
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1">
            <span className="text-[8px] uppercase tracking-wider text-white/25">Powered by</span>
            <span className={`text-[8px] font-bold uppercase tracking-wider ${source.color}`}>
              {source.label}
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
