'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getVibe } from '@/lib/utils'
import CheckInSheet from './CheckInSheet'

type CheckinProfile = { id: string; full_name: string | null; avatar_url: string | null }

interface Props {
  venueId?: string
  venueName?: string
  eventId?: string
  eventTitle?: string
  /** true = event check-in mode (counts all-time), false = venue mode (counts last 3h) */
  eventMode?: boolean
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function CheckInSection({
  venueId, venueName, eventId, eventTitle, eventMode = false,
}: Props) {
  const [count, setCount]         = useState(0)
  const [avatars, setAvatars]     = useState<CheckinProfile[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const windowMs = eventMode ? 0 : 3 * 60 * 60 * 1000
    const since = windowMs > 0
      ? new Date(Date.now() - windowMs).toISOString()
      : '2000-01-01T00:00:00Z'

    let q = supabase
      .from('checkins')
      .select('user_id')
      .in('visibility', ['public', 'followers'])
      .gte('created_at', since)

    if (eventMode && eventId) q = q.eq('event_id', eventId)
    else if (venueId)         q = q.eq('venue_id', venueId)

    q.order('created_at', { ascending: false }).then(async ({ data }) => {
      if (!data) return
      const rows = data as { user_id: string }[]
      setCount(rows.length)

      // Unique user IDs in arrival order for avatar stack
      const seen = new Set<string>()
      const uids: string[] = []
      for (const r of rows) {
        if (!seen.has(r.user_id)) { seen.add(r.user_id); uids.push(r.user_id) }
        if (uids.length >= 4) break
      }
      if (!uids.length) return

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', uids)
      setAvatars((profiles ?? []) as CheckinProfile[])
    })
  }, [venueId, eventId, eventMode])

  const vibe = getVibe(count, true)

  const countLabel = eventMode
    ? `${count} ${count === 1 ? 'personne arrivée' : 'personnes arrivées'}`
    : count === 0
      ? 'Personne ici pour l\'instant'
      : `${count} ${count === 1 ? 'personne ici' : 'personnes ici maintenant'}`

  return (
    <>
      <div className="mb-6">
        {/* Count row + button */}
        <div className="flex items-center gap-3 mb-2">
          {/* Avatar stack */}
          {avatars.length > 0 && (
            <div className="flex -space-x-2 shrink-0">
              {avatars.map((a) => (
                <div
                  key={a.id}
                  className="w-8 h-8 rounded-full border-2 border-[#07070f] overflow-hidden bg-zinc-800 flex items-center justify-center"
                >
                  {a.avatar_url ? (
                    <Image
                      src={a.avatar_url}
                      alt={a.full_name ?? ''}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-[9px] font-bold text-white select-none">
                      {initials(a.full_name)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-white/45 text-xs flex-1">{countLabel}</p>

          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-bold shadow-[0_0_14px_rgba(217,70,239,0.3)] active:scale-95 transition-all shrink-0"
          >
            <MapPin className="w-3.5 h-3.5" />
            Se checker
          </button>
        </div>

        {/* Vibe meter */}
        {vibe && (
          <div className="flex items-center gap-2">
            <Flame className={`w-3.5 h-3.5 ${vibe.color}`} />
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${vibe.color} ${vibe.bg}`}
            >
              {vibe.label}
            </span>
          </div>
        )}
      </div>

      {sheetOpen && (
        <CheckInSheet
          venueId={venueId}
          venueName={venueName}
          preselectedEventId={eventId}
          preselectedEventTitle={eventTitle}
          onClose={() => setSheetOpen(false)}
          onSuccess={() => setCount((n) => n + 1)}
        />
      )}
    </>
  )
}
