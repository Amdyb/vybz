'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Pencil, Trophy, Zap, ChevronRight,
  Calendar, Star, ImageIcon, Loader2, MessageSquare, BadgeCheck, Users, Gift,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, EventWithVenue, RewardClaimWithReward } from '@/lib/types'
import { getInitials, getTier, getTierProgress, CATEGORY_COLORS } from '@/lib/utils'
import EventCard from '@/components/EventCard'
import FollowButton from '@/components/FollowButton'
import FollowListModal from '@/components/FollowListModal'
import RewardClaimCard from '@/components/RewardClaimCard'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  profile: Profile
  isOwn: boolean
  currentUserId: string | null
}

interface Stats {
  followers: number
  following: number
  events: number
  reviews: number
}

type AttendanceRow = {
  status: 'going' | 'interested'
  events: EventWithVenue | null
}

type ReviewRow = {
  id: string
  rating: number | null
  comment: string | null
  created_at: string | null
  venues: { name: string; slug: string | null } | null
}

type PhotoRow = {
  id: string
  media_url: string
  created_at: string
}

type TabKey = 'events' | 'reviews' | 'photos' | 'rewards'
type FollowModal = 'followers' | 'following' | null

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProfileView({ profile, isOwn, currentUserId }: Props) {
  const router = useRouter()

  const [stats, setStats]     = useState<Stats>({ followers: 0, following: 0, events: 0, reviews: 0 })
  const [points, setPoints]   = useState(0)
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [photos, setPhotos]   = useState<PhotoRow[]>([])
  const [rewardClaims, setRewardClaims] = useState<RewardClaimWithReward[]>([])
  const [tab, setTab]         = useState<TabKey>('events')
  const [loading, setLoading] = useState(true)
  const [followModal, setFollowModal] = useState<FollowModal>(null)
  const [starting, setStarting] = useState(false)

  const uid = profile.id

  useEffect(() => {
    let active = true
    async function load() {
      const [followersRes, followingRes, eventsRes, reviewsCountRes, attendanceRes, reviewsRes, photosRes,
             favRes, revPtsRes, tickRes, txnRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', uid).eq('following_type', 'user'),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', uid),
        supabase.from('event_attendance').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'going'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('event_attendance')
          .select('status, events(*, venues(*))')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('reviews')
          .select('id, rating, comment, created_at, venues(name, slug)')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase.from('stories')
          .select('id, media_url, created_at')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(30),
        // Pulse points breakdown (mirrors /profile/pulse-points)
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('pulse_points_transactions').select('points').eq('user_id', uid),
      ])

      if (!active) return

      setStats({
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
        events:    eventsRes.count ?? 0,
        reviews:   reviewsCountRes.count ?? 0,
      })

      const txnTotal = ((txnRes.data ?? []) as { points: number }[]).reduce((s, t) => s + t.points, 0)
      const computed =
        (favRes.count ?? 0) * 5 +
        (revPtsRes.count ?? 0) * 12 +
        (tickRes.count ?? 0) * 30 +
        txnTotal
      setPoints(Math.max(computed, profile.pulse_points ?? 0))

      setAttendance((attendanceRes.data ?? []) as unknown as AttendanceRow[])
      setReviews((reviewsRes.data ?? []) as unknown as ReviewRow[])
      setPhotos((photosRes.data ?? []) as PhotoRow[])
      setLoading(false)

      // My Rewards — only on your own profile (QR codes are private)
      if (isOwn) {
        const { data: claims } = await supabase
          .from('reward_claims')
          .select('*, rewards(id, title, description, points_required, expires_at, profiles(full_name, business_name), events(title))')
          .eq('user_id', uid)
          .order('claimed_at', { ascending: false })
        if (active) setRewardClaims((claims ?? []) as unknown as RewardClaimWithReward[])
      }
    }
    load()
    return () => { active = false }
  }, [uid, profile.pulse_points, isOwn])

  const startConversation = useCallback(async () => {
    if (!currentUserId) { router.push('/sign-in'); return }
    setStarting(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: convId } = await (supabase.rpc as any)('get_or_create_conversation', {
      p_other_user_id: uid,
    })
    if (convId) router.push(`/messages/${convId}`)
    else setStarting(false)
  }, [currentUserId, uid, router])

  const displayName = profile.full_name || 'Utilisateur'
  const username    = profile.username
  const avatarUrl   = profile.avatar_url
  const tier        = getTier(points)
  const progress    = getTierProgress(points, tier)
  const categories  = profile.favorite_categories ?? []

  return (
    <div className="space-y-4">

      {/* ── Identity card ─────────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-[2rem] p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            {avatarUrl ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-purple-500/30">
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-black select-none">
                {getInitials(displayName)}
              </div>
            )}
            {isOwn && (
              <Link
                href="/profile/edit"
                aria-label="Modifier la photo"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-fuchsia-500 border-2 border-zinc-900 flex items-center justify-center hover:bg-fuchsia-400 active:scale-95 transition-all"
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
              </Link>
            )}
          </div>

          <h1
            className="text-xl font-black text-white flex items-center gap-1.5"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {displayName}
            {profile.is_verified_organizer && (
              <BadgeCheck className="w-5 h-5 text-cyan-400" />
            )}
          </h1>
          {username && <p className="text-fuchsia-400/80 text-sm mt-0.5">@{username}</p>}

          {profile.city && (
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{profile.city}</span>
            </div>
          )}

          {profile.bio && (
            <p className="text-zinc-300 text-sm mt-3 max-w-xs leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Actions */}
          <div className="mt-5 w-full flex items-center justify-center gap-2">
            {isOwn ? (
              <Link
                href="/profile/edit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier le profil
              </Link>
            ) : (
              <>
                <FollowButton followingId={uid} followingType="user" />
                <button
                  onClick={startConversation}
                  disabled={starting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-white/80 text-sm font-bold hover:bg-white/10 active:scale-95 transition-all disabled:opacity-60"
                >
                  {starting
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <MessageSquare className="w-3.5 h-3.5" />}
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        {/* Favorite categories */}
        {categories.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/5 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  CATEGORY_COLORS[cat] ?? 'bg-white/10 text-white/60 border-white/10'
                }`}
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        <StatButton label="Abonnés"     value={stats.followers} onClick={() => setFollowModal('followers')} />
        <StatButton label="Abonnements" value={stats.following} onClick={() => setFollowModal('following')} />
        <StatButton label="Événements"  value={stats.events} />
        <StatButton label="Avis"        value={stats.reviews} />
      </div>

      {/* ── Pulse Points card ─────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-[2rem] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Pulse Points
          </h2>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${tier.bg} ${tier.border} ${tier.color}`}>
            <Trophy className="w-3 h-3" />
            {tier.name}
          </div>
        </div>

        <div className="mb-4">
          <span className="text-3xl font-black bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            {points.toLocaleString('fr-FR')}
          </span>
          <span className="text-zinc-400 text-sm ml-2">pts</span>
        </div>

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

        {isOwn && (
          <Link
            href="/profile/pulse-points"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Voir le détail de mes points
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* ── My Crews entry ────────────────────────────────────────────── */}
      {isOwn && (
        <Link
          href="/crews"
          className="flex items-center gap-3 bg-zinc-900 border border-purple-900/30 rounded-[2rem] p-4 hover:border-fuchsia-500/30 active:scale-[0.99] transition-all"
        >
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-fuchsia-300" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-white font-bold text-sm">Mes Crews</span>
            <span className="block text-zinc-500 text-xs">Crée ta squad, planifie vos sorties</span>
          </span>
          <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
        </Link>
      )}

      {/* ── VYBZ Drops entry ──────────────────────────────────────────── */}
      {isOwn && (
        <Link
          href="/drops"
          className="flex items-center gap-3 bg-zinc-900 border border-amber-900/30 rounded-[2rem] p-4 hover:border-amber-500/40 active:scale-[0.99] transition-all"
        >
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/25 to-yellow-400/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-white font-bold text-sm">VYBZ Drops</span>
            <span className="block text-zinc-500 text-xs">Offres flash exclusives, durée limitée</span>
          </span>
          <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
        </Link>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-purple-900/30 rounded-[2rem] p-2">
        <div className={`grid gap-1 ${isOwn ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabButton active={tab === 'events'}  onClick={() => setTab('events')}  icon={Calendar}  label="Événements" />
          <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')} icon={Star}      label="Avis" />
          <TabButton active={tab === 'photos'}  onClick={() => setTab('photos')}  icon={ImageIcon} label="Photos" />
          {isOwn && <TabButton active={tab === 'rewards'} onClick={() => setTab('rewards')} icon={Gift} label="Récompenses" />}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
        </div>
      ) : (
        <div>
          {tab === 'events' && (
            attendance.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {attendance.filter(a => a.events).map((a, i) => (
                  <div key={a.events!.id + i} className="relative">
                    <span className={`absolute top-2 right-2 z-20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      a.status === 'going'
                        ? 'bg-fuchsia-500/90 text-white border-fuchsia-400/50'
                        : 'bg-black/60 text-white/70 border-white/20'
                    }`}>
                      {a.status === 'going' ? 'Je viens' : 'Intéressé'}
                    </span>
                    <EventCard event={a.events!} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Calendar} text={isOwn ? "Vous n'avez pas encore d'événements." : "Aucun événement pour le moment."} />
            )
          )}

          {tab === 'reviews' && (
            reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm truncate">
                        {r.venues?.name ?? 'Lieu'}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${n <= (r.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-zinc-400 text-sm leading-relaxed">{r.comment}</p>}
                    {r.created_at && (
                      <p className="text-white/25 text-[10px] mt-2">
                        {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Star} text={isOwn ? "Vous n'avez pas encore laissé d'avis." : "Aucun avis pour le moment."} />
            )
          )}

          {tab === 'photos' && (
            photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                    <Image src={p.media_url} alt="Photo" fill className="object-cover" sizes="33vw" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ImageIcon} text={isOwn ? "Vous n'avez pas encore publié de photos." : "Aucune photo pour le moment."} />
            )
          )}

          {tab === 'rewards' && isOwn && (
            rewardClaims.length > 0 ? (
              <div className="space-y-3">
                {rewardClaims.filter((c) => c.rewards).map((c) => (
                  <RewardClaimCard
                    key={c.id}
                    title={c.rewards!.title}
                    organizer={c.rewards!.profiles?.business_name || c.rewards!.profiles?.full_name || null}
                    eventName={c.rewards!.events?.title ?? null}
                    qrToken={c.qr_token}
                    status={c.status}
                    expiresAt={c.rewards!.expires_at}
                    pointsRequired={c.rewards!.points_required}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={Gift} text="Vous n'avez pas encore de récompense. Échangez vos points sur la page Récompenses." />
            )
          )}
        </div>
      )}

      {/* ── Follow list modal ─────────────────────────────────────────── */}
      {followModal && (
        <FollowListModal
          userId={uid}
          mode={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  )
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function StatButton({
  label, value, onClick,
}: { label: string; value: number; onClick?: () => void }) {
  const content = (
    <>
      <div className="text-xl font-black text-white mb-0.5 group-hover:text-fuchsia-300 transition-colors">
        {value.toLocaleString('fr-FR')}
      </div>
      <div className="text-zinc-400 text-[10px] leading-tight">{label}</div>
    </>
  )
  const base = 'bg-zinc-900 border border-purple-900/30 rounded-2xl p-3 text-center'
  if (onClick) {
    return (
      <button onClick={onClick} className={`${base} hover:border-fuchsia-500/30 active:scale-[0.98] transition-all group`}>
        {content}
      </button>
    )
  }
  return <div className={`${base} group`}>{content}</div>
}

function TabButton({
  active, onClick, icon: Icon, label,
}: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[11px] font-bold transition-all ${
        active
          ? 'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 text-white border border-fuchsia-500/30'
          : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-12 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-zinc-600" />
      </div>
      <p className="text-zinc-500 text-sm">{text}</p>
    </div>
  )
}
