'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Ticket, Heart, Settings, LogOut,
  ChevronRight, Trophy, Loader2, Zap, Users, RadioTower,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import FollowListModal from '@/components/FollowListModal'

// ─── Tier helpers ────────────────────────────────────────────────────────────

type TierName = 'Neon' | 'Gold' | 'Diamond'

interface Tier {
  name: TierName
  color: string
  bg: string
  border: string
  barFrom: string
  barTo: string
  next: TierName | null
  nextAt: number | null
  prevAt: number
}

function getTier(points: number): Tier {
  if (points >= 2000) {
    return {
      name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/30', barFrom: 'from-cyan-500', barTo: 'to-cyan-300',
      next: null, nextAt: null, prevAt: 2000,
    }
  }
  if (points >= 500) {
    return {
      name: 'Gold', color: 'text-amber-400', bg: 'bg-amber-400/10',
      border: 'border-amber-400/30', barFrom: 'from-amber-500', barTo: 'to-amber-300',
      next: 'Diamond', nextAt: 2000, prevAt: 500,
    }
  }
  return {
    name: 'Neon', color: 'text-purple-400', bg: 'bg-purple-400/10',
    border: 'border-purple-900/50', barFrom: 'from-purple-600', barTo: 'to-purple-400',
    next: 'Gold', nextAt: 500, prevAt: 0,
  }
}

function getProgress(points: number, tier: Tier): number {
  if (!tier.nextAt) return 100
  const range = tier.nextAt - tier.prevAt
  return Math.min(100, ((points - tier.prevAt) / range) * 100)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface Stats {
  favorites: number
  reviews: number
  events: number
}

type CheckinRow = {
  id: string
  created_at: string
  venues: { name: string } | null
  events: { title: string } | null
}

type FollowModal = 'followers' | 'following' | null

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser]           = useState<User | null>(null)
  const [profile, setProfile]     = useState<Profile | null>(null)
  const [stats, setStats]         = useState<Stats>({ favorites: 0, reviews: 0, events: 0 })
  const [points, setPoints]       = useState(0)
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [checkins, setCheckins]   = useState<CheckinRow[]>([])
  const [followModal, setFollowModal] = useState<FollowModal>(null)
  const [loading, setLoading]     = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/sign-in')
        return
      }
      setUser(user)

      const [profileRes, favRes, reviewRes, followersRes, followingRes, checkinsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id).eq('following_type', 'user'),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('checkins').select('id, created_at, venues(name), events(title)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])

      if (profileRes.data) setProfile(profileRes.data as Profile)

      const favCount    = favRes.count ?? 0
      const reviewCount = reviewRes.count ?? 0
      const calculatedPoints = favCount * 5 + reviewCount * 8

      setStats({ favorites: favCount, reviews: reviewCount, events: 0 })
      setPoints(calculatedPoints)
      setFollowers(followersRes.count ?? 0)
      setFollowing(followingRes.count ?? 0)
      setCheckins((checkinsRes.data ?? []) as CheckinRow[])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    'Utilisateur'
  const email = user?.email ?? ''
  const city = profile?.city
  const avatarUrl = profile?.avatar_url
  const tier = getTier(points)
  const progress = getProgress(points, tier)

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">

        {/* ── Identity card ─────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="mb-4">
            {avatarUrl ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-purple-500/30">
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-black select-none">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <h1
            className="text-xl font-black text-white mb-1"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {displayName}
          </h1>
          <p className="text-zinc-400 text-sm mb-3">{email}</p>

          {city && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{city}</span>
            </div>
          )}
        </div>

        {/* ── Pulse Points card ─────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Pulse Points
            </h2>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${tier.bg} ${tier.border} ${tier.color}`}
            >
              <Trophy className="w-3 h-3" />
              {tier.name}
            </div>
          </div>

          <div className="mb-4">
            <span className="text-3xl font-black text-white">
              {points.toLocaleString('fr-FR')}
            </span>
            <span className="text-zinc-400 text-sm ml-2">pts</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tier.barFrom} ${tier.barTo} transition-all duration-700`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>

          <p className="text-zinc-500 text-xs">
            {tier.nextAt
              ? `Encore ${(tier.nextAt - points).toLocaleString('fr-FR')} pts pour passer ${tier.next}`
              : 'Niveau maximum atteint — bienvenue chez les Diamond !'}
          </p>

          <Link
            href="/profile/pulse-points"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Voir le détail de mes points
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Événements', value: stats.events },
            { label: 'Favoris',    value: stats.favorites },
            { label: 'Avis',       value: stats.reviews },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-4 text-center"
            >
              <div className="text-2xl font-black text-white mb-1">{value}</div>
              <div className="text-zinc-400 text-[11px]">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Social stats (Abonnés / Abonnements) ──────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setFollowModal('followers')}
            className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-4 text-center hover:border-fuchsia-500/30 active:scale-[0.98] transition-all group"
          >
            <div className="text-2xl font-black text-white mb-1 group-hover:text-fuchsia-300 transition-colors">
              {followers.toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center justify-center gap-1 text-zinc-400 text-[11px]">
              <Users className="w-3 h-3" />
              Abonnés
            </div>
          </button>
          <button
            onClick={() => setFollowModal('following')}
            className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-4 text-center hover:border-fuchsia-500/30 active:scale-[0.98] transition-all group"
          >
            <div className="text-2xl font-black text-white mb-1 group-hover:text-fuchsia-300 transition-colors">
              {following.toLocaleString('fr-FR')}
            </div>
            <div className="flex items-center justify-center gap-1 text-zinc-400 text-[11px]">
              <Users className="w-3 h-3" />
              Abonnements
            </div>
          </button>
        </div>

        {/* ── Check-in history ──────────────────────────────────────── */}
        {checkins.length > 0 && (
          <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
              <RadioTower className="w-3.5 h-3.5 text-fuchsia-400" />
              Mes check-ins
            </h2>
            <div className="space-y-3">
              {checkins.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-fuchsia-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {c.venues?.name ?? 'Lieu inconnu'}
                    </p>
                    {c.events?.title && (
                      <p className="text-white/40 text-xs truncate">{c.events.title}</p>
                    )}
                    <p className="text-white/25 text-[10px]">
                      {new Date(c.created_at).toLocaleDateString('fr-FR', {
                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Action buttons ────────────────────────────────────────── */}
        <div className="space-y-2">
          <ActionLink href="/profile/pulse-points" icon={<Zap     className="w-5 h-5" />} label="Pulse Points" />
          <ActionLink href="/tickets"              icon={<Ticket  className="w-5 h-5" />} label="Mes Billets" />
          <ActionLink href="/favorites"            icon={<Heart   className="w-5 h-5" />} label="Mes Favoris" />
          <ActionLink href="/settings"             icon={<Settings className="w-5 h-5" />} label="Paramètres" />

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-red-900/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/30 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {signingOut
              ? <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              : <LogOut  className="w-5 h-5 shrink-0" />}
            <span className="font-medium text-sm">
              {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </span>
          </button>
        </div>

      </div>

      {/* ── Follow list modal ────────────────────────────────────────── */}
      {followModal && user && (
        <FollowListModal
          userId={user.id}
          mode={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  )
}

// ─── Reusable nav row ─────────────────────────────────────────────────────────

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-purple-900/30 hover:border-purple-500/30 hover:bg-zinc-800/50 active:scale-[0.98] transition-all group"
    >
      <span className="text-purple-400 shrink-0">{icon}</span>
      <span className="font-medium text-sm text-white/90 flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
    </Link>
  )
}
