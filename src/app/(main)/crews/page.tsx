'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, Plus, Trophy, Crown, ChevronRight, Loader2, X, Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Crew } from '@/lib/types'

type MyCrew = { crew: Crew; role: string; memberCount: number }
type RankedCrew = { crew: Crew; memberCount: number; score: number }

function monthStartISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

export default function CrewsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)
  const [myCrews, setMyCrews] = useState<MyCrew[]>([])
  const [board, setBoard]     = useState<RankedCrew[]>([])

  // Create form
  const [creating, setCreating] = useState(false)
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = useCallback(async (uid: string) => {
    const [crewsRes, membersRes, checkinsRes] = await Promise.all([
      supabase.from('crews').select('*').limit(200),
      supabase.from('crew_members').select('crew_id, user_id, role'),
      supabase.from('checkins').select('user_id').gte('created_at', monthStartISO()),
    ])

    const crews   = (crewsRes.data ?? []) as Crew[]
    const members = (membersRes.data ?? []) as { crew_id: string; user_id: string; role: string }[]
    const checks  = (checkinsRes.data ?? []) as { user_id: string }[]

    // members per crew + check-ins per user (this month)
    const byCrew = new Map<string, { user_id: string; role: string }[]>()
    for (const m of members) {
      const list = byCrew.get(m.crew_id) ?? []
      list.push({ user_id: m.user_id, role: m.role })
      byCrew.set(m.crew_id, list)
    }
    const checkByUser = new Map<string, number>()
    for (const c of checks) checkByUser.set(c.user_id, (checkByUser.get(c.user_id) ?? 0) + 1)

    const crewById = new Map(crews.map((c) => [c.id, c]))

    // My crews
    const mine: MyCrew[] = members
      .filter((m) => m.user_id === uid)
      .map((m) => {
        const crew = crewById.get(m.crew_id)
        if (!crew) return null
        return { crew, role: m.role, memberCount: byCrew.get(m.crew_id)?.length ?? 1 }
      })
      .filter((x): x is MyCrew => !!x)
      .sort((a, b) => (a.role === 'owner' ? -1 : 1) - (b.role === 'owner' ? -1 : 1))

    // Leaderboard: monthly check-ins by members, member count as tiebreak
    const ranked: RankedCrew[] = crews
      .map((crew) => {
        const mem = byCrew.get(crew.id) ?? []
        const score = mem.reduce((s, m) => s + (checkByUser.get(m.user_id) ?? 0), 0)
        return { crew, memberCount: mem.length, score }
      })
      .sort((a, b) => b.score - a.score || b.memberCount - a.memberCount)
      .slice(0, 10)

    setMyCrews(mine)
    setBoard(ranked)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      setUserId(user.id)
      load(user.id)
    })
  }, [router, load])

  async function createCrew() {
    if (!userId) return
    if (!name.trim()) { setError('Donne un nom à ton crew.'); return }
    setSaving(true)
    setError('')

    const { data: crew, error: crewErr } = await supabase
      .from('crews')
      .insert({ name: name.trim(), description: desc.trim() || null, owner_id: userId } as never)
      .select()
      .single()

    if (crewErr || !crew) {
      setError('Une erreur est survenue. Réessaie.')
      setSaving(false)
      return
    }
    const newCrew = crew as Crew

    await supabase.from('crew_members').insert({ crew_id: newCrew.id, user_id: userId, role: 'owner' } as never)
    // Create a crew: +25 Pulse Points
    await supabase.from('pulse_points_transactions').insert({
      user_id: userId, points: 25, action: 'crew', description: 'Crew créé',
    } as never)

    router.push(`/crews/${newCrew.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Crews</h1>
          <p className="text-white/40 text-sm">Crée ta squad, planifiez vos sorties ensemble</p>
        </div>
        <button
          onClick={() => { setCreating(true); setError('') }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold px-4 py-2.5 rounded-full text-sm shadow-[0_0_14px_rgba(217,70,239,0.4)] active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Crew
        </button>
      </div>

      {/* My crews */}
      <section className="mb-8">
        <h2 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-3">Mes crews</h2>
        {myCrews.length === 0 ? (
          <div className="bg-zinc-900 border border-purple-900/30 rounded-[2rem] p-8 text-center">
            <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-4">Tu n&apos;as pas encore de crew.</p>
            <button onClick={() => setCreating(true)} className="text-fuchsia-400 text-sm font-semibold hover:text-fuchsia-300 transition-colors">
              Crée ton premier crew
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myCrews.map(({ crew, role, memberCount }) => (
              <Link
                key={crew.id}
                href={`/crews/${crew.id}`}
                className="flex items-center gap-3 bg-zinc-900 border border-purple-900/30 rounded-2xl p-4 hover:border-fuchsia-500/30 active:scale-[0.99] transition-all"
              >
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-cyan-400/25 border border-fuchsia-500/30 flex items-center justify-center shrink-0 text-white font-black">
                  {crew.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm truncate">{crew.name}</span>
                    {role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </span>
                  <span className="block text-white/40 text-xs">{memberCount} membre{memberCount > 1 ? 's' : ''}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section>
        <h2 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Classement du mois
        </h2>
        {board.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">Aucun crew pour l&apos;instant.</p>
        ) : (
          <div className="space-y-2">
            {board.map((r, i) => (
              <Link
                key={r.crew.id}
                href={`/crews/${r.crew.id}`}
                className="flex items-center gap-3 bg-zinc-900 border border-purple-900/30 rounded-2xl px-4 py-3 hover:border-fuchsia-500/30 transition-all"
              >
                <span className={`w-7 text-center font-black text-sm shrink-0 ${
                  i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-white/30'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-semibold text-sm truncate">{r.crew.name}</span>
                  <span className="block text-white/40 text-xs">{r.memberCount} membre{r.memberCount > 1 ? 's' : ''}</span>
                </span>
                <span className="flex items-center gap-1 text-fuchsia-400 font-bold text-xs shrink-0">
                  <Sparkles className="w-3 h-3" /> {r.score}
                </span>
              </Link>
            ))}
          </div>
        )}
        <p className="text-white/25 text-[11px] text-center mt-3">Score = check-ins du crew ce mois. La squad la plus active gagne des perks.</p>
      </section>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !saving && setCreating(false)} />
          <div className="relative w-full md:max-w-sm bg-zinc-900 border border-purple-900/40 rounded-t-[2rem] md:rounded-[2rem] p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Nouveau crew</h3>
              <button onClick={() => !saving && setCreating(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
            )}

            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Nom du crew</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus
              placeholder="Ex: Les Noctambules"
              className="w-full bg-zinc-800 border border-purple-900/30 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors mb-4"
            />
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Description <span className="text-zinc-600 normal-case">(optionnel)</span></label>
            <textarea
              value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 120))} rows={2}
              placeholder="Votre vibe en quelques mots…"
              className="w-full bg-zinc-800 border border-purple-900/30 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors resize-none mb-5"
            />
            <button
              onClick={createCrew}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Création…</>) : (<><Users className="w-4 h-4" /> Créer le crew (+25 pts)</>)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
