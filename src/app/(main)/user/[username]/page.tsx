'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import ProfileView from '@/components/profile/ProfileView'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = decodeURIComponent(
    Array.isArray(params.username) ? params.username[0] : (params.username ?? '')
  )

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const meId = user?.id ?? null
      setCurrentUserId(meId)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .maybeSingle()

      if (!data) { setNotFound(true); setLoading(false); return }

      // If it's actually me, send to the editable /profile page
      if (meId && (data as Profile).id === meId) {
        router.replace('/profile')
        return
      }

      setProfile(data as Profile)
      setLoading(false)
    }
    if (username) load()
  }, [username, router])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 gap-4">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
          <UserX className="w-6 h-6 text-zinc-600" />
        </div>
        <div>
          <p className="text-white font-bold">Profil introuvable</p>
          <p className="text-zinc-500 text-sm mt-1">@{username} n&apos;existe pas ou a été supprimé.</p>
        </div>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
          <span className="text-white/50 text-sm font-semibold">@{profile.username}</span>
        </div>

        <ProfileView profile={profile} isOwn={false} currentUserId={currentUserId} />
      </div>
    </div>
  )
}
