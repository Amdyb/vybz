'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Users, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type GoingAvatar = { id: string; full_name: string | null; avatar_url: string | null }
type AttendStatus = 'going' | 'interested' | null

interface Props {
  eventId: string
  initialGoingCount: number
  initialInterestedCount: number
  goingAvatars: GoingAvatar[]
}

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function AttendanceButtons({
  eventId,
  initialGoingCount,
  initialInterestedCount,
  goingAvatars,
}: Props) {
  const [status, setStatus] = useState<AttendStatus>(null)
  const [goingCount, setGoingCount] = useState(initialGoingCount)
  const [interestedCount, setInterestedCount] = useState(initialInterestedCount)
  const [busy, setBusy] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setHydrated(true); return }
      setUserId(session.user.id)

      const { data } = await supabase
        .from('event_attendance')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle()

      setStatus(((data as { status: string } | null)?.status as AttendStatus) ?? null)
      setHydrated(true)
    })
  }, [eventId])

  const toggleGoing = async () => {
    if (!userId) { window.location.href = '/sign-in'; return }
    if (busy) return
    setBusy(true)

    if (status === 'going') {
      await supabase
        .from('event_attendance')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)
      setStatus(null)
      setGoingCount((n) => Math.max(0, n - 1))
    } else if (status === 'interested') {
      await supabase
        .from('event_attendance')
        .update({ status: 'going' } as never)
        .eq('user_id', userId)
        .eq('event_id', eventId)
      setStatus('going')
      setGoingCount((n) => n + 1)
      setInterestedCount((n) => Math.max(0, n - 1))
    } else {
      await supabase
        .from('event_attendance')
        .insert({ user_id: userId, event_id: eventId, status: 'going' } as never)
      setStatus('going')
      setGoingCount((n) => n + 1)
    }

    setBusy(false)
  }

  const toggleInterested = async () => {
    if (!userId) { window.location.href = '/sign-in'; return }
    if (busy) return
    setBusy(true)

    if (status === 'interested') {
      await supabase
        .from('event_attendance')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)
      setStatus(null)
      setInterestedCount((n) => Math.max(0, n - 1))
    } else if (status === 'going') {
      await supabase
        .from('event_attendance')
        .update({ status: 'interested' } as never)
        .eq('user_id', userId)
        .eq('event_id', eventId)
      setStatus('interested')
      setInterestedCount((n) => n + 1)
      setGoingCount((n) => Math.max(0, n - 1))
    } else {
      await supabase
        .from('event_attendance')
        .insert({ user_id: userId, event_id: eventId, status: 'interested' } as never)
      setStatus('interested')
      setInterestedCount((n) => n + 1)
    }

    setBusy(false)
  }

  return (
    <div className="mb-6">
      {/* Buttons */}
      <div className="flex gap-3 mb-3">
        <button
          onClick={toggleGoing}
          disabled={busy || !hydrated}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 ${
            status === 'going'
              ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]'
              : 'border border-purple-900/40 text-white/60 hover:border-fuchsia-500/40 hover:text-white/80 bg-transparent'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          Je vais y aller
        </button>

        <button
          onClick={toggleInterested}
          disabled={busy || !hydrated}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 ${
            status === 'interested'
              ? 'border-2 border-purple-500 text-purple-300 bg-purple-500/10'
              : 'border border-purple-900/40 text-white/60 hover:border-purple-500/40 hover:text-white/80 bg-transparent'
          }`}
        >
          <Star className="w-4 h-4 shrink-0" />
          Intéressé(e)
        </button>
      </div>

      {/* Avatar stack + counts */}
      {(goingCount > 0 || interestedCount > 0) && (
        <div className="flex items-center gap-3">
          {goingAvatars.length > 0 && (
            <div className="flex -space-x-2 shrink-0">
              {goingAvatars.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="w-7 h-7 rounded-full border-2 border-[#08080F] overflow-hidden bg-zinc-800 flex items-center justify-center"
                >
                  {a.avatar_url ? (
                    <Image
                      src={a.avatar_url}
                      alt={a.full_name ?? ''}
                      width={28}
                      height={28}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-white">{initials(a.full_name)}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-white/40 leading-snug">
            {goingCount > 0 && (
              <span>
                <span className="text-white/70 font-semibold">{goingCount}</span>{' '}
                {goingCount === 1 ? 'personne y va' : 'personnes y vont'}
              </span>
            )}
            {goingCount > 0 && interestedCount > 0 && ' · '}
            {interestedCount > 0 && (
              <span>
                <span className="text-white/70 font-semibold">{interestedCount}</span>{' '}
                {interestedCount === 1 ? 'intéressé(e)' : 'intéressé(e)s'}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
