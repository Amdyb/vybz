'use client'

import { useEffect, useState, useCallback } from 'react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Users, Crown, ArrowLeft, UserPlus, Search, Calendar, MapPin,
  X, Loader2, Trash2, LogOut, Sparkles, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Crew, CrewMemberWithProfile, EventWithVenue } from '@/lib/types'
import { getInitials, formatDate } from '@/lib/utils'

type SearchHit = { id: string; full_name: string | null; username: string | null; avatar_url: string | null }
type CrewNight = { event: EventWithVenue; goingCount: number }

function monthStartISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

export default function CrewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)
  const [crew, setCrew]       = useState<Crew | null>(null)
  const [members, setMembers] = useState<CrewMemberWithProfile[]>([])
  const [nights, setNights]   = useState<CrewNight[]>([])
  const [score, setScore]     = useState(0)

  // Add-member
  const [adding, setAdding]   = useState(false)
  const [query, setQuery]     = useState('')
  const [hits, setHits]       = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId]   = useState<string | null>(null)
  const [actioning, setActioning] = useState(false)

  const isOwner = !!crew && crew.owner_id === userId
  const isMember = members.some((m) => m.user_id === userId)

  const loadCrew = useCallback(async (uid: string) => {
    const { data: crewRow } = await supabase.from('crews').select('*').eq('id', id).maybeSingle()
    if (!crewRow) { setCrew(null); setLoading(false); return }
    setCrew(crewRow as Crew)

    const { data: memberRows } = await supabase
      .from('crew_members')
      .select('*, profiles(id, full_name, username, avatar_url)')
      .eq('crew_id', id)
      .order('joined_at', { ascending: true })
    const mem = (memberRows ?? []) as CrewMemberWithProfile[]
    setMembers(mem)

    const memberIds = mem.map((m) => m.user_id)
    if (memberIds.length) {
      const today = new Date().toISOString().split('T')[0]
      const [attRes, checkRes] = await Promise.all([
        supabase.from('event_attendance')
          .select('event_id, user_id, events(*, venues(*))')
          .eq('status', 'going').in('user_id', memberIds),
        supabase.from('checkins').select('user_id').in('user_id', memberIds).gte('created_at', monthStartISO()),
      ])

      // Crew nights: upcoming events members are going to, with crew head-count
      const rows = (attRes.data ?? []) as { event_id: string; user_id: string; events: EventWithVenue | null }[]
      const map = new Map<string, CrewNight>()
      for (const r of rows) {
        if (!r.events || r.events.event_date < today) continue
        const existing = map.get(r.event_id)
        if (existing) existing.goingCount += 1
        else map.set(r.event_id, { event: r.events, goingCount: 1 })
      }
      setNights(Array.from(map.values()).sort((a, b) => a.event.event_date.localeCompare(b.event.event_date)))
      setScore((checkRes.data ?? []).length)
    } else {
      setNights([]); setScore(0)
    }

    void uid
    setLoading(false)
  }, [id])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      setUserId(user.id)
      loadCrew(user.id)
    })
  }, [router, loadCrew])

  // Debounced username search (owner only)
  useEffect(() => {
    const q = query.trim()
    if (!q) { setHits([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .ilike('username', `%${q}%`)
        .limit(8)
      const memberIds = new Set(members.map((m) => m.user_id))
      setHits(((data ?? []) as SearchHit[]).filter((p) => !memberIds.has(p.id)))
      setSearching(false)
    }, 350)
    return () => clearTimeout(t)
  }, [query, members])

  async function addMember(p: SearchHit) {
    if (!userId || !crew) return
    setBusyId(p.id)
    const { error } = await supabase.from('crew_members').insert({ crew_id: crew.id, user_id: p.id, role: 'member' } as never)
    if (!error) {
      // Invite a crew member: +15 Pulse Points
      await supabase.from('pulse_points_transactions').insert({
        user_id: userId, points: 15, action: 'crew_invite', description: 'Membre ajouté au crew',
      } as never)
      setQuery('')
      setHits([])
      await loadCrew(userId)
    }
    setBusyId(null)
  }

  async function leaveCrew() {
    if (!userId || !crew) return
    setActioning(true)
    await supabase.from('crew_members').delete().eq('crew_id', crew.id).eq('user_id', userId)
    router.push('/crews')
  }

  async function deleteCrew() {
    if (!crew) return
    setActioning(true)
    await supabase.from('crews').delete().eq('id', crew.id)
    router.push('/crews')
  }

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" /></div>
  }

  if (!crew) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <p className="text-white/40 text-sm mb-4">Ce crew n&apos;existe plus.</p>
        <Link href="/crews" className="text-fuchsia-400 text-sm font-semibold">Retour aux crews</Link>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-lg mx-auto">
      {/* Back */}
      <Link href="/crews" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Crews
      </Link>

      {/* Crew header */}
      <div className="flex items-start gap-4 mb-6">
        <span className="w-16 h-16 rounded-3xl bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/25 border border-fuchsia-500/30 flex items-center justify-center shrink-0 text-white text-2xl font-black">
          {crew.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-2xl font-black text-white leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{crew.name}</h1>
          {crew.description && <p className="text-white/50 text-sm mt-1">{crew.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1 text-white/40"><Users className="w-3.5 h-3.5" />{members.length} membre{members.length > 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1 text-fuchsia-400 font-semibold"><Sparkles className="w-3.5 h-3.5" />{score} ce mois</span>
          </div>
        </div>
      </div>

      {/* Add member (owner only) */}
      {isOwner && (
        <div className="mb-6">
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-purple-900/30 hover:border-fuchsia-500/30 text-white/80 font-bold py-3 rounded-2xl text-sm active:scale-[0.99] transition-all"
            >
              <UserPlus className="w-4 h-4" /> Ajouter un membre
            </button>
          ) : (
            <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Inviter par @username</span>
                <button onClick={() => { setAdding(false); setQuery(''); setHits([]) }} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text" value={query} onChange={(e) => setQuery(e.target.value.replace(/\s/g, '').toLowerCase())} autoFocus
                  placeholder="username"
                  className="w-full bg-zinc-800 border border-purple-900/30 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>
              {searching && <p className="text-white/30 text-xs mt-2 px-1">Recherche…</p>}
              {!searching && query && hits.length === 0 && <p className="text-white/30 text-xs mt-2 px-1">Aucun utilisateur trouvé.</p>}
              <div className="mt-2 space-y-1">
                {hits.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addMember(p)}
                    disabled={busyId === p.id}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar url={p.avatar_url} name={p.full_name || p.username || '?'} size={32} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-white text-sm font-medium truncate">{p.full_name || p.username}</span>
                      {p.username && <span className="block text-white/40 text-xs truncate">@{p.username}</span>}
                    </span>
                    {busyId === p.id ? <Loader2 className="w-4 h-4 text-fuchsia-400 animate-spin" /> : <UserPlus className="w-4 h-4 text-fuchsia-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <section className="mb-8">
        <h2 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-3">Membres</h2>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-zinc-900 border border-purple-900/30 rounded-2xl p-3">
              <Avatar url={m.profiles?.avatar_url ?? null} name={m.profiles?.full_name || m.profiles?.username || '?'} size={40} />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-sm truncate">{m.profiles?.full_name || m.profiles?.username || 'Membre'}</span>
                  {m.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </span>
                {m.profiles?.username && <span className="block text-white/40 text-xs truncate">@{m.profiles.username}</span>}
              </span>
              {m.profiles?.username && (
                <Link href={`/user/${m.profiles.username}`} className="text-white/30 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Crew nights */}
      <section className="mb-8">
        <h2 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Soirées du crew
        </h2>
        {nights.length === 0 ? (
          <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-6 text-center">
            <p className="text-white/40 text-sm">Personne n&apos;a encore prévu de sortie.</p>
            <Link href="/events" className="text-fuchsia-400 text-xs font-semibold mt-2 inline-block">Trouver une soirée</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {nights.map(({ event, goingCount }) => (
              <Link key={event.id} href={`/events/${event.id}`} className="flex items-center gap-3 bg-zinc-900 border border-purple-900/30 rounded-2xl p-3 hover:border-fuchsia-500/30 transition-all">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 shrink-0">
                  {event.cover_image && <Image src={event.cover_image} alt={event.title} fill className="object-cover" sizes="48px" />}
                </div>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-semibold text-sm truncate">{event.title}</span>
                  <span className="flex items-center gap-2 text-white/40 text-xs mt-0.5">
                    <span>{formatDate(event.event_date)}</span>
                    {event.venues?.name && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3 shrink-0" />{event.venues.name}</span>}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-fuchsia-400 text-xs font-bold shrink-0">
                  <Users className="w-3 h-3" />{goingCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Danger zone */}
      {isMember && (
        isOwner ? (
          <button
            onClick={deleteCrew} disabled={actioning}
            className="w-full flex items-center justify-center gap-2 text-red-400/80 hover:text-red-400 text-sm font-semibold py-3 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Supprimer le crew
          </button>
        ) : (
          <button
            onClick={leaveCrew} disabled={actioning}
            className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-white text-sm font-semibold py-3 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" /> Quitter le crew
          </button>
        )
      )}
    </div>
  )
}

function Avatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    return (
      <span className="rounded-full overflow-hidden relative shrink-0" style={{ width: size, height: size }}>
        <Image src={url} alt={name} fill className="object-cover" sizes={`${size}px`} />
      </span>
    )
  }
  return (
    <span
      className="rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-black select-none shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {getInitials(name)}
    </span>
  )
}
