'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { User, Compass, Activity, Zap, Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import NotificationBell from '@/components/NotificationBell'

const navLinks: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/',         label: 'Accueil',   icon: HomeIcon },
  { href: '/discover', label: 'Découvrir', icon: Compass },
  { href: '/feed',     label: 'Feed',      icon: Activity },
  { href: '/tickets',  label: 'Tickets',   icon: Ticket },
]

function getInitials(user: SupabaseUser): string {
  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    '?'
  return name.split(' ').filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatPoints(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 1000)}k`
  return n.toLocaleString('fr-FR')
}

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser]     = useState<SupabaseUser | null>(null)
  const [points, setPoints] = useState<number | null>(null)

  const fetchPoints = useCallback(async (userId: string) => {
    const [favRes, revRes, tickRes, txnRes] = await Promise.all([
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('venue_id', null),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('pulse_points_transactions').select('points').eq('user_id', userId),
    ])
    const txnTotal = ((txnRes.data ?? []) as { points: number }[]).reduce((s, t) => s + (t.points ?? 0), 0)
    setPoints(
      (favRes.count  ?? 0) * 5  +
      (revRes.count  ?? 0) * 12 +
      (tickRes.count ?? 0) * 30 +
      txnTotal
    )
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchPoints(u.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchPoints(u.id)
      else { setPoints(null) }
    })

    return () => subscription.unsubscribe()
  }, [fetchPoints])

  const profileHref   = user ? '/profile' : '/sign-in'
  const profileActive = pathname.startsWith('/profile')

  // Hide the mobile bottom nav inside a 1:1 conversation so it never covers
  // the chat input bar (the conversation view is a focused full-screen layout).
  const isConversation = /^\/messages\/[^/]+$/.test(pathname)

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex items-center justify-between px-8 border-b border-white/5 bg-black sticky top-0 z-50" style={{ minHeight: 60 }}>
        <Link href="/" className="flex items-center">
          <Image src="/vybz-logo.svg" alt="VYBZ" unoptimized height={48} width={48} className="h-12 w-auto" priority />
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === href
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Notification bell — desktop, logged in only */}
          {user && <NotificationBell userId={user.id} />}

          {/* Pulse Points pill — desktop, logged in only */}
          {user && points !== null && (
            <Link
              href="/profile/pulse-points"
              className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all group"
              title="Pulse Points"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:text-amber-300 transition-colors" />
              <span className="text-amber-400 font-bold text-xs group-hover:text-amber-300 transition-colors">
                {formatPoints(points)}
              </span>
            </Link>
          )}

          {/* Avatar — desktop */}
          <Link
            href={profileHref}
            className="ml-2 flex items-center justify-center w-9 h-9 rounded-full transition-all hover:opacity-80 active:scale-95"
            title={user ? 'Mon profil' : 'Se connecter'}
          >
            {user ? (
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white text-xs font-black select-none">
                {getInitials(user)}
              </span>
            ) : (
              <span className="w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 transition-all">
                <User className="w-4 h-4" />
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ── Mobile bottom nav (hidden inside a conversation) ── */}
      {!isConversation && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a16]/95 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around py-3 px-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                  active ? 'text-violet-400' : 'text-white/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-violet-400' : 'text-white/40'}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}

          {/* Profile tab — mobile */}
          <Link
            href={profileHref}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              profileActive ? 'text-violet-400' : 'text-white/40'
            }`}
          >
            <div className="relative">
              {user ? (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black select-none ${
                    profileActive
                      ? 'bg-gradient-to-br from-purple-500 to-cyan-400 text-white'
                      : 'bg-gradient-to-br from-purple-600/70 to-cyan-500/70 text-white'
                  }`}
                >
                  {getInitials(user)}
                </span>
              ) : (
                <User className={`w-5 h-5 ${profileActive ? 'text-violet-400' : 'text-white/40'}`} />
              )}

              {/* Points badge on avatar — only when logged in and points > 0 */}
              {user && points !== null && points > 0 && (
                <span className="absolute -top-1.5 -right-2 flex items-center gap-px bg-amber-500 text-black text-[7px] font-black px-1 py-0.5 rounded-full leading-none whitespace-nowrap pointer-events-none">
                  <Zap className="w-2 h-2 fill-black" />
                  {formatPoints(points)}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>
      )}
    </>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}


