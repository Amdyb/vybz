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
  onVoirTout?: () => void
}

export default function CategoryRow({ title, categoryLabel, events, href, onVoirTout }: Props) {
  return (
    <section className="mb-7">
      {/* Row header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-[11px] font-black text-white/80 uppercase tracking-widest">{title}</h2>
        <Link
          href={href}
          onClick={onVoirTout}
          className="flex items-center gap-0.5 text-[11px] text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors"
        >
          Voir tout
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mx-4">
          <div className="h-52 rounded-2xl border border-dashed border-purple-900/20 flex items-center justify-center">
            <p className="text-white/15 text-xs">Bientôt disponible</p>
          </div>
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pl-4 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingRight: '8px' }}
        >
          {events.map((event) => (
            <HomeEventCard key={event.id} event={event} categoryLabel={categoryLabel} />
          ))}
          {/* Right-end spacer so last card isn't flush against edge */}
          <div className="shrink-0 w-2" />
        </div>
      )}
    </section>
  )
}
