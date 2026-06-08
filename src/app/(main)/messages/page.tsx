'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Plus, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Conversation } from '@/lib/types'

type Profile = { id: string; full_name: string | null; avatar_url: string | null }
type ConvRow = Conversation & { otherUser: Profile | null; unread: number }

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'maintenant'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

export default function MessagesPage() {
  const router = useRouter()
  const [userId, setUserId]               = useState<string | null>(null)
  const [convs, setConvs]                 = useState<ConvRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [query, setQuery]                 = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching]         = useState(false)
  const [starting, setStarting]           = useState<string | null>(null)

  // ── Load conversations ──────────────────────────────────────────────────────
  const loadConvs = useCallback(async (uid: string) => {
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${uid},participant_2_id.eq.${uid}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!convData?.length) { setConvs([]); return }

    const convList = convData as Conversation[]
    const otherIds = convList.map((c) =>
      c.participant_1_id === uid ? c.participant_2_id : c.participant_1_id
    )
    const convIds = convList.map((c) => c.id)

    const [profileRes, unreadRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url').in('id', otherIds),
      supabase.from('messages').select('conversation_id').in('conversation_id', convIds).eq('is_read', false).neq('sender_id', uid),
    ])

    const profileMap = new Map(
      ((profileRes.data ?? []) as Profile[]).map((p) => [p.id, p])
    )
    const unreadMap: Record<string, number> = {}
    for (const r of (unreadRes.data ?? []) as { conversation_id: string }[]) {
      unreadMap[r.conversation_id] = (unreadMap[r.conversation_id] ?? 0) + 1
    }

    setConvs(
      (convData as Conversation[]).map((c) => {
        const otherId = c.participant_1_id === uid ? c.participant_2_id : c.participant_1_id
        return {
          ...c,
          otherUser: profileMap.get(otherId) ?? null,
          unread: unreadMap[c.id] ?? 0,
        }
      })
    )
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/sign-in'); return }
      setUserId(session.user.id)
      await loadConvs(session.user.id)
      setLoading(false)
    })
  }, [router, loadConvs])

  // ── Search users ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!query.trim() || !userId) { setSearchResults([]); return }
    setSearching(true)
    const timer = setTimeout(() => {
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query.trim()}%`)
        .neq('id', userId)
        .limit(6)
        .then(({ data }) => {
          setSearchResults((data ?? []) as Profile[])
          setSearching(false)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [query, userId])

  // ── Start / open conversation ───────────────────────────────────────────────
  const openConversation = async (otherUserId: string) => {
    setStarting(otherUserId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: convId } = await (supabase.rpc as any)('get_or_create_conversation', {
      p_other_user_id: otherUserId,
    })
    if (convId) router.push(`/messages/${convId}`)
    setStarting(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  const showSearch = query.trim().length > 0

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#08080F]/95 backdrop-blur-sm border-b border-white/5 px-4 pt-5 pb-3">
        <h1 className="text-xl font-black text-white mb-3">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un utilisateur..."
            className="w-full bg-zinc-900 border border-purple-900/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-fuchsia-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Search results */}
      {showSearch && (
        <div className="divide-y divide-white/[0.05]">
          {searching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">Aucun utilisateur trouvé</p>
          ) : (
            searchResults.map((p) => (
              <button
                key={p.id}
                onClick={() => openConversation(p.id)}
                disabled={starting === p.id}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                  {p.avatar_url ? (
                    <Image src={p.avatar_url} alt={p.full_name ?? ''} width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-xs font-black text-white">{initials(p.full_name)}</span>
                  )}
                </div>
                <span className="text-white font-semibold text-sm">{p.full_name ?? 'Utilisateur'}</span>
                {starting === p.id && <Loader2 className="w-4 h-4 text-fuchsia-400 animate-spin ml-auto" />}
                <Plus className="w-4 h-4 text-white/30 ml-auto" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Conversation list */}
      {!showSearch && (
        convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-fuchsia-400/40" />
            </div>
            <h2 className="text-white font-black text-lg mb-2">Aucun message</h2>
            <p className="text-white/40 text-sm">Commencez une conversation en cherchant un utilisateur ci-dessus.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {convs.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/messages/${c.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                    {c.otherUser?.avatar_url ? (
                      <Image
                        src={c.otherUser.avatar_url}
                        alt={c.otherUser.full_name ?? ''}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-sm font-black text-white">{initials(c.otherUser?.full_name ?? null)}</span>
                    )}
                  </div>
                  {c.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-fuchsia-500 rounded-full ring-2 ring-[#08080F]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${c.unread > 0 ? 'text-white' : 'text-white/80'}`}>
                      {c.otherUser?.full_name ?? 'Utilisateur'}
                    </p>
                    {c.last_message_at && (
                      <span className="text-[10px] text-white/30 shrink-0 ml-2">{timeAgo(c.last_message_at)}</span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${c.unread > 0 ? 'text-white/60 font-medium' : 'text-white/30'}`}>
                    {c.last_message ?? 'Aucun message'}
                  </p>
                </div>

                {/* Unread badge */}
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                    {c.unread > 9 ? '9+' : c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  )
}
