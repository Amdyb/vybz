'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Users } from 'lucide-react'
import type { EventWithVenue } from '@/lib/types'
import { formatDate, formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const BADGE_COLORS: Record<string, string> = {
  'Sorties & Nightlife':  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Concerts & Live Music': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Food & Drinks':         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Culture & Art':         'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Wellness & Outdoor':    'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'Experiences':           'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

interface Props {
  event: EventWithVenue
  categoryLabel: string
  goingCount?: number
}

export default function HomeEventCard({ event, categoryLabel, goingCount }: Props) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const badgeClass = BADGE_COLORS[categoryLabel] ?? 'bg-white/10 text-white/60 border-white/10'
  const price = formatPrice(event.price_min, event.currency, event.is_free)

  const handleSave = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (saving) return
      setSaving(true)

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        window.location.href = '/sign-in'
        setSaving(false)
        return
      }

      if (saved) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('event_id', event.id)
        setSaved(false)
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: session.user.id, event_id: event.id } as never)
        setSaved(true)
      }
      setSaving(false)
    },
    [saving, saved, event.id]
  )

  return (
    <Link href={`/events/${event.id}`} className="group block snap-start shrink-0 w-44">
      <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-purple-900/30 group-hover:border-fuchsia-500/30 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.12)] group-hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative h-56 bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40">
          {event.cover_image && (
            <Image
              src={event.cover_image}
              alt={event.title}
              fill
              className="object-cover"
              sizes="176px"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

          {/* Heart save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-all active:scale-90 ${
              saved
                ? 'bg-fuchsia-500/90 text-white'
                : 'bg-black/50 border border-white/10 text-white/50 hover:text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-white' : ''}`} />
          </button>

          {/* Date pill */}
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 text-center min-w-[32px]">
            <div className="text-[8px] text-white/50 uppercase leading-none">
              {new Date(event.event_date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
            </div>
            <div className="text-sm font-black text-white leading-tight">
              {new Date(event.event_date + 'T00:00:00').getDate()}
            </div>
          </div>
        </div>

        {/* Text content */}
        <div className="p-3 pt-2.5">
          <span className={`inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${badgeClass}`}>
            {event.category}
          </span>
          <h3 className="text-white/90 text-xs font-semibold mt-1.5 mb-1 line-clamp-2 group-hover:text-white transition-colors leading-snug">
            {event.title}
          </h3>
          {event.venues?.name && (
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="w-2.5 h-2.5 text-white/30 shrink-0" />
              <p className="text-white/40 text-[10px] truncate">{event.venues.name}</p>
            </div>
          )}
          <p className="text-white/25 text-[10px] mb-2">{formatDate(event.event_date)}</p>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${event.is_free ? 'text-cyan-400' : 'text-amber-400'}`}>
              {price || '—'}
            </span>
            {goingCount != null && goingCount > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-fuchsia-400/60 font-medium">
                <Users className="w-2.5 h-2.5" />
                {goingCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
