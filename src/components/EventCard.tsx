import Image from 'next/image'
import Link from 'next/link'
import type { EventWithVenue } from '@/lib/types'
import { formatDate, formatTime, formatPrice, CATEGORY_COLORS } from '@/lib/utils'

const CATEGORY_GRADIENTS: Record<string, string> = {
  Nightlife:   'from-violet-900/60 via-purple-900/40 to-black/60',
  Jazz:        'from-amber-900/60 via-orange-900/40 to-black/60',
  Culture:     'from-emerald-900/60 via-teal-900/40 to-black/60',
  Rooftop:     'from-sky-900/60 via-blue-900/40 to-black/60',
  Underground: 'from-rose-900/60 via-red-900/40 to-black/60',
}

export default function EventCard({ event }: { event: EventWithVenue }) {
  const gradient = CATEGORY_GRADIENTS[event.category] ?? 'from-gray-900/60 to-black/60'
  const badgeClass = CATEGORY_COLORS[event.category] ?? 'bg-white/10 text-white/60 border-white/10'
  const price = formatPrice(event.price_min, event.currency, event.is_free)

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-[#0f0f1a] border border-white/[0.06] hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:-translate-y-0.5">

        {/* Image / gradient header */}
        <div className={`relative h-40 flex items-end p-4 ${event.cover_image ? 'bg-black' : `bg-gradient-to-br ${gradient}`}`}>
          {event.cover_image && (
            <Image
              src={event.cover_image}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          {/* Overlay — always shown so badges stay readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Date pill */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1.5 text-center z-10">
            <div className="text-[10px] text-white/50 uppercase tracking-widest leading-none">
              {new Date(event.event_date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
            </div>
            <div className="text-lg font-bold text-white leading-tight">
              {new Date(event.event_date + 'T00:00:00').getDate()}
            </div>
          </div>

          {/* Category badge */}
          <span className={`relative z-10 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeClass}`}>
            {event.category}
          </span>

          {event.is_featured && (
            <span className="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-wider bg-rose-500/90 text-white px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white/90 text-sm leading-snug mb-1 group-hover:text-white transition-colors line-clamp-1">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-3">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(event.event_date)} · {formatTime(event.start_time)}
            {event.venues?.name && (
              <>
                <span className="text-white/20">·</span>
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{event.venues.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${event.is_free ? 'text-emerald-400' : 'text-white/80'}`}>
              {price || '—'}
            </span>
            <span className="text-[10px] text-violet-400/70 group-hover:text-violet-400 transition-colors font-medium">
              Voir →
            </span>
          </div>
        </div>

      </div>
    </Link>
  )
}
