'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { EventWithVenue } from '@/lib/types'
import HomeEventCard from './HomeEventCard'

interface Props {
  title: string
  categoryLabel: string
  events: EventWithVenue[]
  href: string
}

export default function CategoryRow({ title, categoryLabel, events, href }: Props) {
  return (
    <section className="mb-8">
      {/* Row header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-sm font-black text-white uppercase tracking-wide">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors"
        >
          Voir tout
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {events.length === 0 ? (
        /* Empty placeholder */
        <div className="mx-4">
          <div className="h-52 rounded-2xl border border-dashed border-purple-900/30 flex items-center justify-center">
            <p className="text-white/20 text-xs">Bientôt disponible</p>
          </div>
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pl-4 pr-4 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {events.map((event) => (
            <HomeEventCard key={event.id} event={event} categoryLabel={categoryLabel} />
          ))}
          {/* End spacer so last card doesn't clip */}
          <div className="shrink-0 w-1" />
        </div>
      )}
    </section>
  )
}
