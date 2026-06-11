'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Zap, Clock, Lock, Check, Flame, Ticket, MapPin, Calendar, Loader2, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { DropWithEvent } from '@/lib/types'
import { formatPrice, formatDate, DROP_TIER_MIN, DROP_TIER_LABEL } from '@/lib/utils'

const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000

export default function DropsPage() {
  const [loading, setLoading]     = useState(true)
  const [userId, setUserId]       = useState<string | null>(null)
  const [points, setPoints]       = useState(0)
  const [drops, setDrops]         = useState<DropWithEvent[]>([])
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())
  const [now, setNow]             = useState(() => Date.now())
  const [claiming, setClaiming]   = useState<string | null>(null)
  const [errors, setErrors]       = useState<Record<string, string>>({})

  // 1s tick for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)

    const reqs: PromiseLike<unknown>[] = [
      supabase.from('drops')
        .select('*, events(id, title, cover_image, event_date, start_time, category, city, venues(name, city))')
        .eq('is_active', true)
        .order('expires_at', { ascending: true }),
    ]
    if (user) {
      reqs.push(
        supabase.from('drop_claims').select('drop_id').eq('user_id', user.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('venue_id', null),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pulse_points_transactions').select('points').eq('user_id', user.id),
      )
    }
    const res = await Promise.all(reqs) as never[]

    setDrops(((res[0] as { data?: DropWithEvent[] }).data ?? []) as DropWithEvent[])

    if (user) {
      const claims = (res[1] as { data?: { drop_id: string }[] }).data ?? []
      setClaimedIds(new Set(claims.map((c) => c.drop_id)))
      const favC = (res[2] as { count?: number }).count ?? 0
      const revC = (res[3] as { count?: number }).count ?? 0
      const tikC = (res[4] as { count?: number }).count ?? 0
      const txns = (res[5] as { data?: { points: number }[] }).data ?? []
      const txnTotal = txns.reduce((s, t) => s + (t.points ?? 0), 0)
      setPoints(favC * 5 + revC * 12 + tikC * 30 + txnTotal)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function claim(dropId: string) {
    if (!userId) { window.location.href = '/sign-in'; return }
    setClaiming(dropId)
    setErrors((e) => ({ ...e, [dropId]: '' }))
    const { data, error } = await supabase.rpc('claim_drop', { p_drop_id: dropId } as never)
    const code = (error ? 'error' : (data as unknown as string))

    if (code === 'ok') {
      setClaimedIds((s) => new Set(s).add(dropId))
      setDrops((ds) => ds.map((d) => d.id === dropId ? { ...d, quantity_claimed: d.quantity_claimed + 1 } : d))
    } else {
      const msg: Record<string, string> = {
        sold_out: 'Épuisé !', expired: 'Offre expirée', already_claimed: 'Déjà réclamé',
        tier_too_low: 'Niveau insuffisant', not_started: 'Pas encore disponible',
        inactive: 'Drop indisponible', not_found: 'Drop introuvable', error: 'Une erreur est survenue',
      }
      setErrors((e) => ({ ...e, [dropId]: msg[code] ?? 'Une erreur est survenue' }))
      if (code === 'already_claimed') setClaimedIds((s) => new Set(s).add(dropId))
      if (code === 'sold_out') setDrops((ds) => ds.map((d) => d.id === dropId ? { ...d, quantity_claimed: d.quantity_available } : d))
    }
    setClaiming(null)
  }

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
  }

  const active = drops.filter((d) => new Date(d.starts_at).getTime() <= now && new Date(d.expires_at).getTime() > now)
  const upcoming = drops.filter((d) => {
    const s = new Date(d.starts_at).getTime()
    return s > now && s <= now + UPCOMING_WINDOW_MS
  })
  const myClaims = drops.filter((d) => claimedIds.has(d.id))

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/25 to-yellow-400/20 border border-amber-500/40 mb-3 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
          <Zap className="w-7 h-7 text-amber-400 fill-amber-400" />
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500" style={{ fontFamily: 'Syne, sans-serif' }}>
          VYBZ Drops
        </h1>
        <p className="text-amber-200/50 text-sm mt-1.5 max-w-xs mx-auto">
          Offres flash exclusives — disponibles pour une durée limitée
        </p>
      </div>

      {/* Active */}
      {active.length > 0 ? (
        <section className="mb-9 space-y-4">
          {active.map((d) => (
            <ActiveDropCard
              key={d.id} drop={d} now={now} points={points}
              claimed={claimedIds.has(d.id)} claiming={claiming === d.id}
              error={errors[d.id]} onClaim={() => claim(d.id)}
            />
          ))}
        </section>
      ) : (
        <div className="bg-zinc-900 border border-amber-900/30 rounded-[2rem] p-10 text-center mb-9">
          <Flame className="w-9 h-9 text-amber-500/40 mx-auto mb-3" />
          <p className="text-white/70 font-semibold">Aucun drop actif pour le moment</p>
          <p className="text-white/35 text-sm mt-1">Revenez bientôt pour des offres exclusives</p>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-9">
          <h2 className="text-[11px] font-black text-amber-200/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Bientôt disponibles
          </h2>
          <div className="space-y-3">
            {upcoming.map((d) => <UpcomingDropCard key={d.id} drop={d} now={now} />)}
          </div>
        </section>
      )}

      {/* My claims */}
      {myClaims.length > 0 && (
        <section>
          <h2 className="text-[11px] font-black text-amber-200/50 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" /> Mes drops réclamés
          </h2>
          <div className="space-y-2">
            {myClaims.map((d) => (
              <Link key={d.id} href={d.events ? `/events/${d.events.id}` : '/tickets'} className="flex items-center gap-3 bg-zinc-900 border border-amber-900/30 rounded-2xl p-3 hover:border-amber-500/40 transition-all">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-amber-900/40 to-yellow-900/30 shrink-0">
                  {d.events?.cover_image && <Image src={d.events.cover_image} alt="" fill className="object-cover" sizes="48px" />}
                </div>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-semibold text-sm truncate">{d.events?.title ?? 'Drop'}</span>
                  <span className="block text-amber-400 text-xs font-bold">{formatPrice(d.drop_price, d.currency, d.drop_price === 0)} · réclamé</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold shrink-0">
                  <Check className="w-3.5 h-3.5" /> Mon ticket
                  <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Countdown formatting ──────────────────────────────────────────────────────
function parts(ms: number) {
  const clamp = Math.max(0, ms)
  const totalSec = Math.floor(clamp / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return { d, h, m, s }
}
const pad = (n: number) => n.toString().padStart(2, '0')

function CountdownPills({ ms }: { ms: number }) {
  const { d, h, m, s } = parts(ms)
  const cells = d > 0
    ? [[d, 'J'], [h, 'H'], [m, 'M']] as const
    : [[h, 'H'], [m, 'M'], [s, 'S']] as const
  return (
    <div className="flex items-center gap-1.5">
      {cells.map(([v, label], i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="min-w-[34px] text-center bg-black/60 border border-amber-500/30 rounded-lg px-1.5 py-1 text-amber-300 font-black text-base tabular-nums leading-none">
            {pad(v)}
          </span>
          <span className="text-[8px] text-amber-200/40 font-bold mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Active card ───────────────────────────────────────────────────────────────
function ActiveDropCard({
  drop, now, points, claimed, claiming, error, onClaim,
}: {
  drop: DropWithEvent; now: number; points: number
  claimed: boolean; claiming: boolean; error?: string; onClaim: () => void
}) {
  const remaining = drop.quantity_available - drop.quantity_claimed
  const expired   = new Date(drop.expires_at).getTime() <= now
  const required  = DROP_TIER_MIN[drop.min_tier_required]
  const locked    = points < required
  const free      = drop.drop_price === 0

  let label = 'Réclamer'
  let disabled = false
  let style = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_18px_rgba(245,158,11,0.35)]'
  let Icon = Zap
  if (claimed)         { label = 'Réclamé';  disabled = true; style = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'; Icon = Check }
  else if (expired)    { label = 'Expiré';   disabled = true; style = 'bg-white/5 text-white/30 border border-white/10'; Icon = Clock }
  else if (remaining <= 0) { label = 'Épuisé'; disabled = true; style = 'bg-white/5 text-white/30 border border-white/10'; Icon = Flame }
  else if (locked)     { label = `Niveau ${DROP_TIER_LABEL[drop.min_tier_required]} requis`; disabled = true; style = 'bg-white/5 text-amber-200/50 border border-amber-500/20'; Icon = Lock }

  return (
    <div className="relative rounded-[1.75rem] overflow-hidden bg-zinc-900 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.08)]">
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-amber-900/40 to-yellow-900/30">
        {drop.events?.cover_image && (
          <Image src={drop.events.cover_image} alt={drop.events.title} fill className="object-cover" sizes="(max-width:512px) 100vw, 512px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Discount badge */}
        {drop.discount_percent != null && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-sm px-2.5 py-1 rounded-full shadow-lg">
            -{drop.discount_percent}%
          </span>
        )}
        {/* Tier badge */}
        {drop.min_tier_required !== 'all' && drop.min_tier_required !== 'neon' && (
          <span className="absolute top-3 right-3 bg-black/70 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
            {DROP_TIER_LABEL[drop.min_tier_required]}+
          </span>
        )}

        {/* Countdown */}
        <div className="absolute bottom-3 right-3"><CountdownPills ms={new Date(drop.expires_at).getTime() - now} /></div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-white font-black text-lg leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
          {drop.events?.title ?? 'Drop exclusif'}
        </h3>
        <div className="flex items-center gap-3 text-white/40 text-xs mt-1.5">
          {drop.events?.venues?.name && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{drop.events.venues.name}</span>}
          {drop.events?.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" />{formatDate(drop.events.event_date)}</span>}
        </div>

        {/* Price */}
        <div className="flex items-end gap-2 mt-3">
          <span className={`font-black text-2xl ${free ? 'text-cyan-400' : 'text-amber-400'}`}>
            {free ? 'Gratuit' : formatPrice(drop.drop_price, drop.currency, false)}
          </span>
          {drop.original_price != null && drop.original_price > 0 && (
            <span className="text-white/30 line-through text-sm mb-0.5">{formatPrice(drop.original_price, drop.currency, false)}</span>
          )}
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-white/40">
            {remaining > 0 ? <><span className="text-amber-300 font-bold">{remaining}</span> restant{remaining > 1 ? 's' : ''} / {drop.quantity_available}</> : 'Plus de stock'}
          </span>
          {error && <span className="text-red-400 text-xs font-medium">{error}</span>}
        </div>

        {/* Claim */}
        <button
          onClick={onClaim}
          disabled={disabled || claiming}
          className={`w-full mt-3 flex items-center justify-center gap-2 font-bold py-3.5 rounded-full text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed ${style}`}
        >
          {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
          {claiming ? 'Réclamation…' : label}
        </button>
        {locked && !claimed && !expired && remaining > 0 && (
          <p className="text-center text-amber-200/40 text-[11px] mt-2">Réservé aux membres {DROP_TIER_LABEL[drop.min_tier_required]} et plus</p>
        )}
      </div>
    </div>
  )
}

// ─── Upcoming (locked) card ────────────────────────────────────────────────────
function UpcomingDropCard({ drop, now }: { drop: DropWithEvent; now: number }) {
  const inHours = Math.max(1, Math.ceil((new Date(drop.starts_at).getTime() - now) / 3600000))
  return (
    <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-amber-900/20">
      <div className="relative h-28">
        {drop.events?.cover_image && <Image src={drop.events.cover_image} alt="" fill className="object-cover blur-md scale-110 opacity-40" sizes="512px" />}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
          <Lock className="w-5 h-5 text-amber-300/70 mb-0.5" />
          <span className="text-amber-200/80 text-sm font-bold">Revenez dans {inHours}h</span>
          <span className="text-white/40 text-[11px]">
            {drop.discount_percent != null ? `-${drop.discount_percent}% · ` : ''}{drop.events?.title ?? 'Drop à venir'}
          </span>
        </div>
      </div>
    </div>
  )
}
