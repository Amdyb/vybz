'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Ticket, MapPin } from 'lucide-react'
import type { EventWithVenue } from '@/lib/types'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'

export default function HeroCarousel({ events }: { events: EventWithVenue[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const pausedRef = useRef(false)

  // Sync active dot with scroll position
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

  // Auto-advance every 5 seconds unless user is interacting
  useEffect(() => {
    if (events.length <= 1) return
    const timer = setInterval(() => {
      if (pausedRef.current) return
      setActive((prev) => {
        const next = (prev + 1) % events.length
        scrollRef.current?.scrollTo({
          left: next * (scrollRef.current?.clientWidth ?? 0),
          behavior: 'smooth',
        })
        return next
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [events.length])

  const scrollTo = (idx: number) => {
    pausedRef.current = true
    setTimeout(() => { pausedRef.current = false }, 8000)
    scrollRef.current?.scrollTo({
      left: idx * (scrollRef.current?.clientWidth ?? 0),
      behavior: 'smooth',
    })
  }

  if (!events.length) return null

  return (
    <div className="mb-6 mt-3">
      {/* Cards */}
      <div
        ref={scrollRef}
        onTouchStart={() => { pausedRef.current = true }}
        onTouchEnd={() => { setTimeout(() => { pausedRef.current = false }, 8000) }}
        className="flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', gap: '12px', paddingLeft: '16px', paddingRight: '16px' }}
      >
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="snap-center shrink-0 relative rounded-3xl overflow-hidden bg-zinc-900 border border-purple-900/30 active:scale-[0.98] transition-transform"
            style={{ width: 'calc(100vw - 3rem)', maxWidth: 400, height: 500 }}
          >
            {event.cover_image ? (
              <Image
                src={event.cover_image}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 400px"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-cyan-900" />
            )}

            {/* Gradient overlay — strong at bottom for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

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

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
              <h2 className="text-[22px] font-black text-white mb-1.5 leading-tight line-clamp-2 tracking-tight">
                {event.title}
              </h2>

              {event.venues?.name && (
                <div className="flex items-center gap-1 mb-0.5">
                  <MapPin className="w-3 h-3 text-white/40 shrink-0" />
                  <p className="text-white/50 text-xs truncate">{event.venues.name}</p>
                </div>
              )}

              <p className="text-white/35 text-xs mb-5">
                {formatDate(event.event_date)} · {formatTime(event.start_time)}
              </p>

              <div className="flex items-center justify-between">
                <span
                  className={`text-lg font-black ${
                    event.is_free ? 'text-cyan-400' : 'text-amber-400'
                  }`}
                >
                  {formatPrice(event.price_min, event.currency, event.is_free)}
                </span>
                <span className="flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.4)]">
                  <Ticket className="w-3.5 h-3.5" />
                  Voir l&apos;événement
                </span>
              </div>
            </div>
          </Link>
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
