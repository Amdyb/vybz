'use client'

import { useEffect, useState, useCallback } from 'react'
import { Gift, Zap, Lock, Check, Loader2, X, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { RewardWithOrg } from '@/lib/types'
import { DROP_TIER_MIN, DROP_TIER_LABEL } from '@/lib/utils'
import RewardClaimCard from '@/components/RewardClaimCard'

type ClaimInfo = { qr_token: string; status: 'claimed' | 'redeemed' | 'expired' }

function orgName(r: RewardWithOrg): string {
  return r.profiles?.business_name || r.profiles?.full_name || 'Organisateur'
}

export default function RewardsPage() {
  const [loading, setLoading]   = useState(true)
  const [userId, setUserId]     = useState<string | null>(null)
  const [points, setPoints]     = useState(0)
  const [rewards, setRewards]   = useState<RewardWithOrg[]>([])
  const [claims, setClaims]     = useState<Record<string, ClaimInfo>>({})
  const [claiming, setClaiming] = useState<string | null>(null)
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [modal, setModal]       = useState<RewardWithOrg | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)

    const reqs: PromiseLike<unknown>[] = [
      supabase.from('rewards')
        .select('*, profiles(id, full_name, business_name, avatar_url), events(id, title)')
        .eq('is_active', true)
        .order('points_required', { ascending: true }),
    ]
    if (user) {
      reqs.push(
        supabase.from('reward_claims').select('reward_id, qr_token, status').eq('user_id', user.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('venue_id', null),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pulse_points_transactions').select('points').eq('user_id', user.id),
      )
    }
    const res = await Promise.all(reqs) as never[]

    setRewards(((res[0] as { data?: RewardWithOrg[] }).data ?? []) as RewardWithOrg[])
    if (user) {
      const cl = (res[1] as { data?: { reward_id: string; qr_token: string; status: ClaimInfo['status'] }[] }).data ?? []
      setClaims(Object.fromEntries(cl.map((c) => [c.reward_id, { qr_token: c.qr_token, status: c.status }])))
      const fav = (res[2] as { count?: number }).count ?? 0
      const rev = (res[3] as { count?: number }).count ?? 0
      const tik = (res[4] as { count?: number }).count ?? 0
      const txn = ((res[5] as { data?: { points: number }[] }).data ?? []).reduce((s, t) => s + (t.points ?? 0), 0)
      setPoints(fav * 5 + rev * 12 + tik * 30 + txn)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function claim(r: RewardWithOrg) {
    if (!userId) { window.location.href = '/sign-in'; return }
    setClaiming(r.id)
    setErrors((e) => ({ ...e, [r.id]: '' }))
    const { data, error } = await supabase.rpc('claim_reward', { p_reward_id: r.id } as never)
    const result = (error ? { status: 'error', code: 'error' } : data) as { status: string; code?: string; qr_token?: string }

    if (result.status === 'ok' && result.qr_token) {
      setClaims((c) => ({ ...c, [r.id]: { qr_token: result.qr_token as string, status: 'claimed' } }))
      setRewards((rs) => rs.map((x) => x.id === r.id ? { ...x, quantity_claimed: x.quantity_claimed + 1 } : x))
      setPoints((p) => p - r.points_required)
      setModal(r)
    } else {
      const msg: Record<string, string> = {
        not_enough_points: 'Points insuffisants', tier_too_low: 'Niveau insuffisant',
        sold_out: 'Épuisé', expired: 'Expirée', already_claimed: 'Déjà réclamée',
        inactive: 'Indisponible', not_found: 'Introuvable', error: 'Une erreur est survenue',
      }
      setErrors((e) => ({ ...e, [r.id]: msg[result.code ?? 'error'] ?? 'Une erreur est survenue' }))
      if (result.code === 'already_claimed') load()
    }
    setClaiming(null)
  }

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/25 to-yellow-400/20 border border-amber-500/40 flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-400" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-white leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>Récompenses</h1>
            <p className="text-white/40 text-xs mt-1">Échange tes Pulse Points</p>
          </div>
        </div>
        {userId && (
          <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1.5">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-amber-400 font-black text-sm">{points.toLocaleString('fr-FR')}</span>
          </span>
        )}
      </div>

      {rewards.length === 0 ? (
        <div className="bg-zinc-900 border border-amber-900/30 rounded-[2rem] p-10 text-center">
          <Gift className="w-9 h-9 text-amber-500/40 mx-auto mb-3" />
          <p className="text-white/70 font-semibold">Aucune récompense disponible</p>
          <p className="text-white/35 text-sm mt-1">Reviens bientôt pour échanger tes points</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((r) => {
            const remaining = r.quantity_available - r.quantity_claimed
            const expired   = !!r.expires_at && new Date(r.expires_at).getTime() <= Date.now()
            const required  = DROP_TIER_MIN[r.tier_required]
            const tierLocked = points < required
            const claim_ = claims[r.id]
            const claimed = !!claim_
            const enough  = points >= r.points_required

            let label = `Réclamer · ${r.points_required} pts`
            let disabled = false
            let style = 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
            let Icon = Gift
            let onClick: () => void = () => claim(r)

            if (claimed)        { label = 'Voir mon QR';  style = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'; Icon = Check; onClick = () => setModal(r); disabled = false }
            else if (expired)   { label = 'Expirée';      disabled = true; style = 'bg-white/5 text-white/30 border border-white/10'; Icon = Lock }
            else if (remaining <= 0) { label = 'Épuisée'; disabled = true; style = 'bg-white/5 text-white/30 border border-white/10'; Icon = Lock }
            else if (tierLocked){ label = `Niveau ${DROP_TIER_LABEL[r.tier_required]} requis`; disabled = true; style = 'bg-white/5 text-amber-200/50 border border-amber-500/20'; Icon = Lock }
            else if (!enough)   { label = `Il te manque ${(r.points_required - points).toLocaleString('fr-FR')} pts`; disabled = true; style = 'bg-white/5 text-white/40 border border-white/10'; Icon = Zap }

            return (
              <div key={r.id} className="bg-zinc-900 border border-amber-900/30 rounded-[1.75rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-white font-black text-base leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{r.title}</h3>
                    <p className="text-amber-400/80 text-xs font-semibold mt-0.5">par {orgName(r)}</p>
                    {r.events?.title && <p className="text-white/30 text-[11px] mt-0.5">{r.events.title}</p>}
                  </div>
                  <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1 shrink-0">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-amber-400 font-black text-xs">{r.points_required}</span>
                  </span>
                </div>

                {r.description && <p className="text-white/50 text-sm mt-2 leading-relaxed">{r.description}</p>}

                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1 text-white/40 text-xs">
                    <Users className="w-3 h-3" />
                    {remaining > 0 ? <><span className="text-amber-300 font-bold">{remaining}</span> restante{remaining > 1 ? 's' : ''}</> : 'Épuisée'}
                  </span>
                  {r.tier_required !== 'all' && r.tier_required !== 'neon' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">{DROP_TIER_LABEL[r.tier_required]}+</span>
                  )}
                  {errors[r.id] && <span className="text-red-400 text-xs font-medium">{errors[r.id]}</span>}
                </div>

                <button
                  onClick={onClick}
                  disabled={disabled || claiming === r.id}
                  className={`w-full mt-3 flex items-center justify-center gap-2 font-bold py-3 rounded-full text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed ${style}`}
                >
                  {claiming === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  {claiming === r.id ? 'Réclamation…' : label}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* QR modal */}
      {modal && claims[modal.id] && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-sm">
            <button onClick={() => setModal(null)} className="absolute -top-10 right-0 text-white/60 hover:text-white"><X className="w-6 h-6" /></button>
            <RewardClaimCard
              title={modal.title}
              organizer={orgName(modal)}
              eventName={modal.events?.title ?? null}
              qrToken={claims[modal.id].qr_token}
              status={claims[modal.id].status}
              expiresAt={modal.expires_at}
              pointsRequired={modal.points_required}
            />
          </div>
        </div>
      )}
    </div>
  )
}
