'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  followingId: string
  followingType: 'user' | 'venue' | 'organizer'
  /** Show follower count fetched client-side */
  showCount?: boolean
}

export default function FollowButton({ followingId, followingType, showCount = false }: Props) {
  const [following, setFollowing]   = useState(false)
  const [count, setCount]           = useState(0)
  const [busy, setBusy]             = useState(false)
  const [userId, setUserId]         = useState<string | null>(null)
  const [hydrated, setHydrated]     = useState(false)

  useEffect(() => {
    async function init() {
      // Fetch follower count if requested
      if (showCount) {
        const { count: c } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', followingId)
        setCount(c ?? 0)
      }

      // Check if current user already follows
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setHydrated(true); return }
      setUserId(session.user.id)

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', followingId)
        .maybeSingle()

      setFollowing(!!data)
      setHydrated(true)
    }
    init()
  }, [followingId, showCount])

  const toggle = async () => {
    if (!userId) { window.location.href = '/sign-in'; return }
    if (busy) return
    setBusy(true)

    if (following) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', followingId)
      setFollowing(false)
      setCount((n) => Math.max(0, n - 1))
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: userId, following_id: followingId, following_type: followingType } as never)
      setFollowing(true)
      setCount((n) => n + 1)
    }

    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={busy || !hydrated}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 disabled:opacity-60 ${
          following
            ? 'border border-white/20 bg-white/5 text-white/70 hover:border-red-500/30 hover:text-red-400'
            : 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-[0_0_16px_rgba(217,70,239,0.25)]'
        }`}
      >
        {following
          ? <Check className="w-3.5 h-3.5 shrink-0" />
          : <UserPlus className="w-3.5 h-3.5 shrink-0" />}
        {following ? 'Abonné(e)' : 'Suivre'}
      </button>

      {showCount && count > 0 && (
        <span className="text-xs text-white/40">
          <span className="text-white/70 font-semibold">{count.toLocaleString('fr-FR')}</span>{' '}
          {count === 1 ? 'abonné' : 'abonnés'}
        </span>
      )}
    </div>
  )
}
