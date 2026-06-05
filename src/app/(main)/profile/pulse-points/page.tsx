'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Star, Zap, Lock, CheckCircle2,
  Loader2, TrendingUp, Ticket, Heart, MessageSquare,
  Users, Camera, Sun, Gift, Crown, CalendarCheck,
  ArrowUpRight, ArrowDownLeft, Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PulsePointsTransaction } from '@/lib/types'

// ─── Tier config ─────────────────────────────────────────────────────────────

type TierName = 'Neon' | 'Gold' | 'Diamond'

interface Tier {
  name: TierName
  min: number
  max: number | null
  color: string
  bg: string
  border: string
  barGradient: string
  icon: React.ElementType
  nextName: TierName | null
  nextAt: number | null
}

const TIERS: Tier[] = [
  {
    name: 'Neon', min: 0, max: 499,
    color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30',
    barGradient: 'from-purple-600 to-purple-400',
    icon: Zap, nextName: 'Gold', nextAt: 500,
  },
  {
    name: 'Gold', min: 500, max: 1999,
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    barGradient: 'from-amber-500 to-amber-300',
    icon: Star, nextName: 'Diamond', nextAt: 2000,
  },
  {
    name: 'Diamond', min: 2000, max: null,
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30',
    barGradient: 'from-cyan-500 to-cyan-300',
    icon: Crown, nextName: null, nextAt: null,
  },
]

function getTier(pts: number): Tier {
  if (pts >= 2000) return TIERS[2]
  if (pts >= 500)  return TIERS[1]
  return TIERS[0]
}

function getProgress(pts: number, tier: Tier): number {
  if (!tier.nextAt) return 100
  return Math.min(100, Math.max(2, ((pts - tier.min) / (tier.nextAt - tier.min)) * 100))
}

// ─── Milestones ───────────────────────────────────────────────────────────────

const MILESTONES = [
  { pts: 100,  label: 'Badge VYBZ Member',              tier: null },
  { pts: 250,  label: '−10% sur le prochain billet',    tier: null },
  { pts: 500,  label: 'Verre offert chez un partenaire', tier: 'Neon' as TierName },
  { pts: 750,  label: 'Accès anticipé aux VYBZ Drops',  tier: null },
  { pts: 1000, label: '1 entrée événement gratuite',     tier: null },
  { pts: 1500, label: 'Upgrade VIP sur prochain billet', tier: null },
  { pts: 2000, label: '2 billets gratuits par mois',     tier: 'Gold' as TierName },
  { pts: 3000, label: 'Concierge VYBZ personnel',        tier: null },
  { pts: 5000, label: 'VIP mensuel + passes backstage',  tier: 'Diamond' as TierName },
]

// ─── Earn categories ──────────────────────────────────────────────────────────

const EARN_CATEGORIES = [
  {
    label: 'Découverte',
    icon: Sun,
    color: 'text-amber-400',
    items: [
      { label: 'Ouvrir l\'app chaque jour',          pts: 2 },
      { label: 'Consulter une page événement',       pts: 1 },
      { label: 'Ajouter un favori',                  pts: 5 },
      { label: 'Partager un événement',              pts: 10 },
      { label: 'Suivre un organisateur',             pts: 5 },
    ],
  },
  {
    label: 'Social',
    icon: Users,
    color: 'text-purple-400',
    items: [
      { label: 'Check-in à un événement',            pts: 20 },
      { label: 'Publier une photo',                  pts: 15 },
      { label: 'Taguer un ami',                      pts: 10 },
      { label: 'Laisser un avis',                    pts: 12 },
      { label: 'Noter un lieu',                      pts: 8 },
      { label: 'Créer un crew',                      pts: 25 },
      { label: 'Inviter un membre dans le crew',     pts: 15 },
    ],
  },
  {
    label: 'Transactions',
    icon: Ticket,
    color: 'text-cyan-400',
    items: [
      { label: 'Acheter un billet',                  pts: 30 },
      { label: 'Faire une réservation',              pts: 20 },
      { label: 'Parrainer un ami (inscription)',     pts: 50 },
      { label: 'Parrainer un ami (achat)',           pts: 100 },
    ],
  },
  {
    label: 'Fidélité',
    icon: CalendarCheck,
    color: 'text-emerald-400',
    items: [
      { label: 'Fréquenter le même lieu 3x',         pts: 30, bonus: true },
      { label: '5 événements dans le mois',          pts: 50, bonus: true },
      { label: 'Compléter son profil',               pts: 20, bonus: true },
      { label: 'Terminer l\'onboarding',             pts: 15, bonus: true },
      { label: 'Premier billet de sa vie',           pts: 50, bonus: true },
    ],
  },
  {
    label: 'Spécial',
    icon: Gift,
    color: 'text-rose-400',
    items: [
      { label: 'Check-in le jour de son anniversaire', pts: 100 },
      { label: 'Assister à un événement Featured',     pts: 25 },
      { label: 'Premier check-in à un événement',      pts: 30 },
      { label: 'Achat VYBZ Drops',                     pts: 40 },
    ],
  },
]

// ─── Action label map (for transactions) ─────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ticket:    { label: 'Billet acheté',           icon: Ticket,        color: 'text-cyan-400' },
  checkin:   { label: 'Check-in événement',      icon: CalendarCheck, color: 'text-emerald-400' },
  review:    { label: 'Avis laissé',             icon: MessageSquare, color: 'text-purple-400' },
  favorite:  { label: 'Favori enregistré',       icon: Heart,         color: 'text-rose-400' },
  photo:     { label: 'Photo publiée',           icon: Camera,        color: 'text-amber-400' },
  daily:     { label: 'Ouverture quotidienne',   icon: Sun,           color: 'text-amber-300' },
  referral:  { label: 'Parrainage',              icon: Users,         color: 'text-emerald-400' },
  follow:    { label: 'Abonnement organisateur', icon: Star,          color: 'text-purple-300' },
  crew:      { label: 'Crew créé',              icon: Users,          color: 'text-violet-400' },
  birthday:  { label: 'Anniversaire',           icon: Gift,           color: 'text-rose-400' },
  drops:     { label: 'Achat VYBZ Drops',       icon: Zap,            color: 'text-cyan-300' },
  profile:   { label: 'Profil complété',        icon: CheckCircle2,   color: 'text-emerald-400' },
  redeem:    { label: 'Récompense échangée',    icon: Gift,           color: 'text-amber-400' },
}

function getActionMeta(action: string) {
  return ACTION_LABELS[action] ?? { label: action, icon: TrendingUp, color: 'text-zinc-400' }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'à l\'instant'
  if (mins < 60)  return `il y a ${mins} min`
  if (hours < 24) return `il y a ${hours}h`
  if (days < 30)  return `il y a ${days}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PulsePointsPage() {
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [points, setPoints]     = useState(0)
  const [txns, setTxns]         = useState<PulsePointsTransaction[]>([])
  const [breakdown, setBreakdown] = useState({ favorites: 0, reviews: 0, tickets: 0, txnTotal: 0 })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }

      const [favRes, revRes, tickRes, txnRes] = await Promise.all([
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id).is('venue_id', null),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('pulse_points_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ])

      const favPts  = (favRes.count  ?? 0) * 5
      const revPts  = (revRes.count  ?? 0) * 12
      const tickPts = (tickRes.count ?? 0) * 30
      const txnData = (txnRes.data ?? []) as PulsePointsTransaction[]
      const txnTotal = txnData.reduce((s, t) => s + t.points, 0)

      setBreakdown({ favorites: favPts, reviews: revPts, tickets: tickPts, txnTotal })
      setPoints(favPts + revPts + tickPts + txnTotal)
      setTxns(txnData)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  const tier     = getTier(points)
  const progress = getProgress(points, tier)
  const TierIcon = tier.icon

  const nextMilestone = MILESTONES.find(m => m.pts > points)
  const ptsToNext = nextMilestone ? nextMilestone.pts - points : 0

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full bg-zinc-900 border border-purple-900/30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          Pulse Points
        </h1>
      </div>

      {/* ── Hero card ── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-6 mb-4 text-center">
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">
          Votre solde total
        </p>
        <p className="text-5xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3">
          {points.toLocaleString('fr-FR')}
        </p>
        <p className="text-zinc-500 text-sm mb-4">points</p>

        {/* Tier badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-black ${tier.bg} ${tier.border} ${tier.color}`}>
          <TierIcon className="w-4 h-4" />
          {tier.name}
        </div>

        {/* Progress bar */}
        {tier.nextAt && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>{tier.name}</span>
              <span>{tier.nextName}</span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tier.barGradient} transition-all duration-700`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-zinc-500 text-xs mt-2">
              Encore <span className="text-white font-semibold">{(tier.nextAt - points).toLocaleString('fr-FR')} pts</span> pour atteindre {tier.nextName}
            </p>
          </div>
        )}
        {!tier.nextAt && (
          <p className="text-cyan-400 text-xs mt-4 font-semibold">
            Niveau maximum atteint — bienvenue chez les Diamond !
          </p>
        )}
      </div>

      {/* ── Next milestone preview ── */}
      {nextMilestone && (
        <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-0.5">Prochaine récompense</p>
            <p className="text-white text-sm font-semibold leading-tight">{nextMilestone.label}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-purple-400 font-black text-sm">{ptsToNext.toLocaleString('fr-FR')}</p>
            <p className="text-zinc-600 text-[10px]">pts manquants</p>
          </div>
        </div>
      )}

      {/* ── Points breakdown ── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
          Répartition de vos points
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Favoris enregistrés', pts: breakdown.favorites, icon: Heart,         color: 'text-rose-400' },
            { label: 'Avis laissés',         pts: breakdown.reviews,   icon: MessageSquare, color: 'text-purple-400' },
            { label: 'Billets achetés',      pts: breakdown.tickets,   icon: Ticket,        color: 'text-cyan-400' },
            { label: 'Activités diverses',   pts: breakdown.txnTotal,  icon: TrendingUp,    color: 'text-emerald-400' },
          ].map(({ label, pts: p, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <span className="text-zinc-400 text-sm flex-1">{label}</span>
              <span className={`font-bold text-sm ${p > 0 ? 'text-white' : 'text-zinc-600'}`}>
                +{p.toLocaleString('fr-FR')} pts
              </span>
            </div>
          ))}
          <div className="border-t border-white/5 pt-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Total</span>
            <span className="font-black text-white">{points.toLocaleString('fr-FR')} pts</span>
          </div>
        </div>
      </div>

      {/* ── Ways to earn ── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
          Comment gagner des points
        </h2>
        <div className="space-y-5">
          {EARN_CATEGORIES.map(cat => {
            const CatIcon = cat.icon
            return (
              <div key={cat.label}>
                <div className="flex items-center gap-2 mb-2">
                  <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${cat.color}`}>{cat.label}</span>
                </div>
                <div className="space-y-1.5">
                  {cat.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs leading-tight pr-4">{item.label}</span>
                      <span className={`text-xs font-bold shrink-0 ${
                        (item as { bonus?: boolean }).bonus ? 'text-emerald-400' : 'text-purple-300'
                      }`}>
                        +{item.pts}
                        {(item as { bonus?: boolean }).bonus && ' bonus'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Milestones / rewards available ── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
          Récompenses et jalons
        </h2>
        <div className="space-y-2.5">
          {MILESTONES.map(m => {
            const unlocked = points >= m.pts
            return (
              <div
                key={m.pts}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  unlocked
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-zinc-800/30 border-zinc-800/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  unlocked ? 'bg-emerald-500/15' : 'bg-zinc-700/40'
                }`}>
                  {unlocked
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <Lock className="w-3.5 h-3.5 text-zinc-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${unlocked ? 'text-white' : 'text-zinc-500'}`}>
                    {m.label}
                  </p>
                  {m.tier && (
                    <p className="text-[10px] text-zinc-600 mt-0.5">Palier {m.tier}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-bold ${unlocked ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {m.pts.toLocaleString('fr-FR')} pts
                  </p>
                  {unlocked && (
                    <p className="text-[10px] text-emerald-600">Débloqué</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Transaction history ── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
          Historique des transactions
        </h2>

        {txns.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Clock className="w-10 h-10 text-purple-400/20 mb-3" />
            <p className="text-zinc-500 text-sm font-medium">Aucune transaction</p>
            <p className="text-zinc-600 text-xs mt-1 max-w-xs leading-relaxed">
              Vos activités (check-ins, achats, avis) apparaîtront ici dès qu&apos;elles seront enregistrées.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {txns.map(tx => {
              const meta = getActionMeta(tx.action)
              const MetaIcon = meta.icon
              const isPositive = tx.points >= 0
              return (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <MetaIcon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium leading-tight">
                      {tx.description || meta.label}
                    </p>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{relativeTime(tx.created_at)}</p>
                  </div>
                  <div className={`flex items-center gap-0.5 text-sm font-bold shrink-0 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive
                      ? <ArrowUpRight className="w-3.5 h-3.5" />
                      : <ArrowDownLeft className="w-3.5 h-3.5" />}
                    {isPositive ? '+' : ''}{tx.points}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  )
}
