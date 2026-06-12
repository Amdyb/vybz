'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, User, ChevronDown, MapPin, Globe, Check, Plane } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import NotificationBell from '@/components/NotificationBell'
import { useLocation } from '@/components/LocationProvider'

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
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [open, setOpen] = useState(false)
  const { detectedCity, homeCity, diaspora, activeCity, setDiaspora } = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const profileHref = user ? '/profile' : '/sign-in'

  function choose(useDiaspora: boolean) {
    setDiaspora(useDiaspora)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-2.5">
        <Link href="/">
          <Image
            src="/vybz-logo.svg"
            alt="VYBZ" unoptimized
            height={36}
            width={36}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* City selector — opens the Diaspora Mode picker */}
        <div className="relative">
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 active:scale-95 transition-transform">
            {diaspora && <Globe className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="text-sm font-bold text-white">{activeCity}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {diaspora && (
            <span className="absolute -bottom-2 left-0 text-[8px] font-bold uppercase tracking-wider text-cyan-400/80 whitespace-nowrap">
              Mode Diaspora
            </span>
          )}

          {open && (
            <>
              {/* Backdrop to close on outside tap */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute top-full left-0 mt-2 z-50 w-64 rounded-2xl bg-zinc-900 border border-purple-900/40 shadow-xl shadow-black/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Quels VYBZ ?</p>
                </div>

                {/* Current location */}
                <button
                  onClick={() => choose(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-fuchsia-400" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-white truncate">{detectedCity}</span>
                    <span className="block text-[11px] text-white/40">Ma position actuelle</span>
                  </span>
                  {!diaspora && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </button>

                {/* Home city (Diaspora) */}
                {homeCity ? (
                  <button
                    onClick={() => choose(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    <span className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Plane className="w-4 h-4 text-cyan-400" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-white truncate">{homeCity}</span>
                      <span className="block text-[11px] text-white/40">Ma ville d&apos;origine · Diaspora</span>
                    </span>
                    {diaspora && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>
                ) : (
                  <Link
                    href="/profile/edit"
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-t border-white/5"
                  >
                    <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Plane className="w-4 h-4 text-white/40" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-white/80">Mode Diaspora</span>
                      <span className="block text-[11px] text-white/40">Ajoute ta ville d&apos;origine</span>
                    </span>
                  </Link>
                )}

                <p className="px-4 py-2.5 text-[11px] text-white/30 border-t border-white/5 leading-relaxed">
                  Retrouve les events de chez toi, où que tu sois.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {user ? (
          <NotificationBell userId={user.id} />
        ) : (
          <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
            <Bell className="w-[18px] h-[18px] text-white/60" />
          </button>
        )}

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
