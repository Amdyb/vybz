'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Users, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Entry = {
  id: string
  name: string | null
  avatar: string | null
  kind: 'user' | 'venue' | 'organizer'
}

interface Props {
  userId: string
  mode: 'followers' | 'following'
  onClose: () => void
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function FollowListModal({ userId, mode, onClose }: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (mode === 'followers') {
        const { data: rows } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        const ids = (rows ?? []).map((r) => (r as { follower_id: string }).follower_id)
        if (!ids.length) { setLoading(false); return }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', ids)

        setEntries(
          ((profiles ?? []) as { id: string; full_name: string | null; avatar_url: string | null }[]).map((p) => ({
            id: p.id,
            name: p.full_name,
            avatar: p.avatar_url,
            kind: 'user' as const,
          }))
        )
      } else {
        const { data: rows } = await supabase
          .from('follows')
          .select('following_id, following_type')
          .eq('follower_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (!rows?.length) { setLoading(false); return }

        type Row = { following_id: string; following_type: string }
        const typed = rows as Row[]
        const userIds  = typed.filter((r) => r.following_type === 'user').map((r) => r.following_id)
        const venueIds = typed.filter((r) => r.following_type !== 'user').map((r) => r.following_id)

        const [profilesRes, venuesRes] = await Promise.all([
          userIds.length
            ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
            : Promise.resolve({ data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }),
          venueIds.length
            ? supabase.from('venues').select('id, name, cover_image').in('id', venueIds)
            : Promise.resolve({ data: [] as { id: string; name: string; cover_image: string | null }[] }),
        ])

        const profileMap = new Map(
          ((profilesRes.data ?? []) as { id: string; full_name: string | null; avatar_url: string | null }[]).map((p) => [p.id, p])
        )
        const venueMap = new Map(
          ((venuesRes.data ?? []) as { id: string; name: string; cover_image: string | null }[]).map((v) => [v.id, v])
        )

        setEntries(
          typed.map((r) => {
            if (r.following_type === 'user') {
              const p = profileMap.get(r.following_id)
              return { id: r.following_id, name: p?.full_name ?? null, avatar: p?.avatar_url ?? null, kind: 'user' as const }
            }
            const v = venueMap.get(r.following_id)
            return {
              id: r.following_id,
              name: v?.name ?? null,
              avatar: v?.cover_image ?? null,
              kind: r.following_type as 'venue' | 'organizer',
            }
          })
        )
      }
      setLoading(false)
    }
    load()
  }, [userId, mode])

  const title = mode === 'followers' ? 'Abonnés' : 'Abonnements'
  const kindLabel = (k: Entry['kind']) =>
    k === 'user' ? 'Utilisateur' : k === 'venue' ? 'Lieu' : 'Organisateur'

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-purple-900/30 rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <h2 className="text-white font-black text-base">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-white/15 border-t-fuchsia-400 rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">
                {mode === 'followers' ? 'Aucun abonné pour l\'instant' : 'Vous ne suivez personne encore'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                    {entry.avatar ? (
                      <Image
                        src={entry.avatar}
                        alt={entry.name ?? ''}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs font-black text-white">{initials(entry.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{entry.name ?? 'Inconnu'}</p>
                    <p className="text-white/30 text-[10px]">{kindLabel(entry.kind)}</p>
                  </div>
                  {entry.kind !== 'user' && (
                    <MapPin className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
