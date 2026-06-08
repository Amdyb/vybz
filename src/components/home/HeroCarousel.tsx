'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Ticket } from 'lucide-react'
import type { EventWithVenue } from '@/lib/types'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'

export default function HeroCarousel({ events }: { events: EventWithVenue[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth)
      setActive(Math.max(0, Math.min(idx, events.length - 1)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [events.length])

  const scrollTo = (idx: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }

  if (!events.length) return null

  return (
    <div className="mb-8">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="snap-center shrink-0 relative rounded-3xl overflow-hidden bg-zinc-900 border border-purple-900/30"
            style={{ width: 'calc(100vw - 3rem)', maxWidth: 380, height: 480 }}
          >
            {event.cover_image ? (
              <Image
                src={event.cover_image}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 380px"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-cyan-900" />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

            {/* Featured badge */}
            {event.is_featured && (
              <div className="absolute top-4 left-4 z-10 bg-fuchsia-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                À la une
              </div>
            )}

            {/* Category badge */}
            <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
              {event.category}
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <h2 className="text-2xl font-black text-white mb-1.5 leading-tight line-clamp-2">
                {event.title}
              </h2>
              {event.venues?.name && (
                <p className="text-white/50 text-xs mb-0.5">{event.venues.name}</p>
              )}
              <p className="text-white/40 text-xs mb-4">
                {formatDate(event.event_date)} · {formatTime(event.start_time)}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-base font-black ${
                    event.is_free ? 'text-cyan-400' : 'text-amber-400'
                  }`}
                >
                  {formatPrice(event.price_min, event.currency, event.is_free)}
                </span>
                <Link
                  href={`/events/${event.id}`}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Acheter
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {events.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-3">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-5 h-1.5 bg-fuchsia-400'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
