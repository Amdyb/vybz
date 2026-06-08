'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity, UserCheck, Bookmark, Star,
  Camera, CalendarDays, MapPin, RefreshCw, Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { ActivityFeed } from '@/lib/types'

type FeedProfile = { id: string; full_name: string | null; avatar_url: string | null }
type FeedItem = ActivityFeed & { profile: FeedProfile | null }

const PAGE_SIZE = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'maintenant'
  if (m < 60) return `il y a ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getActionText(item: ActivityFeed): string {
  const m = item.metadata
  switch (item.action_type) {
    case 'event_attendance': return `va à ${m.event_title ?? 'un événement'}`
    case 'event_interest':   return `s'intéresse à ${m.event_title ?? 'un événement'}`
    case 'review':           return `a noté ${m.venue_name ?? 'un lieu'} ${m.rating ?? '?'} étoiles`
    case 'story':            return 'a publié une story'
    case 'event_created':    return `a créé l'événement ${m.event_title ?? ''}`
    case 'checkin':          return `est à ${m.venue_name ?? 'un lieu'} en ce moment`
    case 'recommendation':   return `recommande ${m.event_title ?? 'un événement'}`
    default:                 return 'a fait quelque chose'
  }
}

type LucideIcon = React.ComponentType<{ className?: string }>

function getActionIcon(type: string): LucideIcon {
  switch (type) {
    case 'event_attendance': return UserCheck
    case 'event_interest':   return Bookmark
    case 'review':           return Star
    case 'story':            return Camera
    case 'event_created':    return CalendarDays
    case 'checkin':          return MapPin
    default:                 return Activity
  }
}

function getTargetHref(item: ActivityFeed): string | null {
  if (item.target_type === 'event' && item.target_id) return `/events/${item.target_id}`
  if (item.target_type === 'venue' && item.target_id) return `/venues/${item.target_id}`
  return null
}

// ─── Feed item ────────────────────────────────────────────────────────────────

function FeedItemRow({ item }: { item: FeedItem }) {
  const ActionIcon = getActionIcon(item.action_type)
  const href = getTargetHref(item)
  const m = item.metadata
  const targetLabel =
    item.target_type === 'event' ? (m.event_title as string | null) :
    item.target_type === 'venue' ? (m.venue_name as string | null) : null

  return (
    <div className="flex items-start gap-3 px-4 py-4 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
        {item.profile?.avatar_url ? (
          <Image
            src={item.profile.avatar_url}
            alt={item.profile.full_name ?? ''}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-xs font-black text-white select-none">
            {initials(item.profile?.full_name ?? null)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 leading-snug">
          <span className="font-bold text-white">
            {item.profile?.full_name ?? 'Utilisateur'}
          </span>
          {' '}{getActionText(item)}
        </p>

        {/* Target pill link */}
        {href && targetLabel && (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/55 hover:text-white hover:border-fuchsia-500/30 transition-colors max-w-full"
          >
            <span className="truncate">{targetLabel}</span>
            {m.event_date && (
              <span className="text-white/30 shrink-0">
                ·{' '}
                {new Date(String(m.event_date) + 'T00:00:00').toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </Link>
        )}

        {/* Stars for reviews */}
        {item.action_type === 'review' && m.rating && (
          <div className="flex items-center gap-0.5 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${
                  i < Number(m.rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 fill-zinc-700'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}

        <p className="text-white/25 text-[11px] mt-1">{timeAgo(item.created_at)}</p>
      </div>

      {/* Action icon badge */}
      <div className="w-8 h-8 rounded-full bg-fuchsia-500/10 flex items-center justify-center shrink-0 mt-0.5">
        <ActionIcon className="w-3.5 h-3.5 text-fuchsia-400" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const router = useRouter()
  const [followedIds, setFollowedIds] = useState<string[]>([])
  const [items, setItems]             = useState<FeedItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const sentinelRef  = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Pull-to-refresh state
  const touchStartY = useRef(0)
  const isPulling   = useRef(false)
  const [pullY, setPullY] = useState(0)

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async (
    ids: string[],
    offset: number,
    append: boolean,
  ) => {
    if (!ids.length) return

    const { data: rows } = await supabase
      .from('activity_feed')
      .select('*')
      .in('user_id', ids)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    const activities = (rows ?? []) as ActivityFeed[]
    setHasMore(activities.length === PAGE_SIZE)

    if (!activities.length) {
      if (!append) setItems([])
      return
    }

    const uids = Array.from(new Set(activities.map((r) => r.user_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', uids)

    const pMap = new Map(((profiles ?? []) as FeedProfile[]).map((p) => [p.id, p]))
    const enriched: FeedItem[] = activities.map((r) => ({ ...r, profile: pMap.get(r.user_id) ?? null }))

    if (append) setItems((prev) => [...prev, ...enriched])
    else setItems(enriched)
  }, [])

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/sign-in'); return }

      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id)
        .eq('following_type', 'user')

      const ids = ((follows ?? []) as { following_id: string }[]).map((f) => f.following_id)
      setFollowedIds(ids)

      if (ids.length) await fetchItems(ids, 0, false)
      setLoading(false)
    }
    init()
  }, [router, fetchItems])

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMore && followedIds.length) {
          setLoadingMore(true)
          fetchItems(followedIds, items.length, true).finally(() => setLoadingMore(false))
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadingMore, hasMore, followedIds, items.length, fetchItems])

  // ── Refresh ────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (refreshing || !followedIds.length) return
    setRefreshing(true)
    setHasMore(true)
    await fetchItems(followedIds, 0, false)
    setRefreshing(false)
  }, [refreshing, followedIds, fetchItems])

  // ── Pull-to-refresh touch handlers ────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    const el = containerRef.current
    if (!el || el.scrollTop > 2) return
    touchStartY.current = e.touches[0].clientY
    isPulling.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return
    const el = containerRef.current
    if (el && el.scrollTop > 2) { isPulling.current = false; setPullY(0); return }
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0) setPullY(Math.min(dy * 0.4, 56))
    else { isPulling.current = false; setPullY(0) }
  }

  const handleTouchEnd = () => {
    if (isPulling.current && pullY >= 48) refresh()
    isPulling.current = false
    setPullY(0)
  }

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-40 bg-white/5 rounded-lg animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 bg-white/5 rounded animate-pulse w-4/5" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-2/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Empty — no follows ─────────────────────────────────────────────────────
  if (followedIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-fuchsia-400/40" />
        </div>
        <h2 className="text-white font-black text-lg mb-2">Fil d&apos;actualité</h2>
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          Suivez des organisateurs et des amis pour voir leur activité ici.
        </p>
        <Link
          href="/discover"
          className="px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-bold rounded-2xl active:scale-95 transition-transform"
        >
          Découvrir des lieux
        </Link>
      </div>
    )
  }

  // ── Feed ───────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="min-h-screen overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullY > 0 && (
        <div
          className="flex items-center justify-center"
          style={{ height: pullY, overflow: 'hidden' }}
        >
          <RefreshCw
            className={`w-4 h-4 transition-transform ${pullY >= 48 ? 'text-fuchsia-400 rotate-180' : 'text-white/30'}`}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <h1 className="text-xl font-black text-white">Fil d&apos;actualité</h1>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white/60 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Items or empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <Activity className="w-10 h-10 text-white/10 mb-3" />
          <p className="text-white/30 text-sm">Pas encore d&apos;activité.</p>
          <p className="text-white/20 text-xs mt-1">
            L&apos;activité des personnes que vous suivez apparaîtra ici.
          </p>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <FeedItemRow key={item.id} item={item} />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="py-6 flex justify-center">
            {loadingMore ? (
              <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
            ) : !hasMore ? (
              <p className="text-white/20 text-xs">Tout est affiché</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
