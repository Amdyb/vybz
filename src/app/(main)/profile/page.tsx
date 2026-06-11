'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket, Heart, Settings, LogOut, ChevronRight,
  Zap, Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import ProfileView from '@/components/profile/ProfileView'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/sign-in')
        return
      }
      setUser(user)

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileRow) {
        setProfile(profileRow as Profile)
      } else {
        // Minimal fallback profile so the page still renders
        setProfile({
          id: user.id,
          full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
          username: null, bio: null, avatar_url: null,
          city: null, country: null, language: null, role: 'user',
          business_name: null, subscription_plan: 'basic', is_verified_organizer: false,
          is_organizer: false, organizer_preferences: null,
          favorite_categories: [], pulse_points: 0, events_attended: 0, reviews_count: 0,
          created_at: null,
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading || !profile || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto space-y-4">

        <ProfileView profile={profile} isOwn currentUserId={user.id} />

        {/* ── Account actions ───────────────────────────────────────── */}
        <div className="space-y-2 pt-2">
          <ActionLink href="/profile/pulse-points" icon={<Zap      className="w-5 h-5" />} label="Pulse Points" />
          <ActionLink href="/tickets"              icon={<Ticket   className="w-5 h-5" />} label="Mes Billets" />
          <ActionLink href="/favorites"            icon={<Heart    className="w-5 h-5" />} label="Mes Favoris" />
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
    </div>
  )
}

function ActionLink({
  href, icon, label,
}: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900 border border-purple-900/30 hover:border-purple-500/30 hover:bg-zinc-800/50 active:scale-[0.98] transition-all group"
    >
      <span className="text-fuchsia-400 shrink-0">{icon}</span>
      <span className="font-medium text-sm text-white/90 flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
    </Link>
  )
}
