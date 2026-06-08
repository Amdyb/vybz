'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, User, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

function getInitials(user: SupabaseUser): string {
  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function CityHeader() {
  const [city, setCity] = useState('Dakar')
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => { if (data.city) setCity(data.city) })
      .catch(() => {})

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const profileHref = user ? '/profile' : '/sign-in'

  return (
    <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-2.5">
        <Link href="/">
          <Image
            src="/vybz-logo.png"
            alt="VYBZ"
            height={36}
            width={36}
            className="h-9 w-auto"
            priority
          />
        </Link>
        <button className="flex items-center gap-1">
          <span className="text-sm font-bold text-white">{city}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <Bell className="w-[18px] h-[18px] text-white/60" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-fuchsia-500 rounded-full" />
        </button>

        <Link href={profileHref}>
          {user ? (
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white text-xs font-black select-none">
              {getInitials(user)}
            </span>
          ) : (
            <span className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <User className="w-4 h-4 text-white/40" />
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
