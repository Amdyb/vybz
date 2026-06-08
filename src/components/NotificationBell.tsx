'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Notif = {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'maintenant'
  if (m < 60) return `il y a ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen]       = useState(false)
  const [unread, setUnread]   = useState(0)
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch unread count on mount
  useEffect(() => {
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then(({ count }) => setUnread(count ?? 0))
  }, [userId])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = async () => {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    setNotifs((data ?? []) as Notif[])
    setLoading(false)

    // Mark all as read
    if (unread > 0) {
      await supabase
        .from('notifications')
        .update({ is_read: true } as never)
        .eq('user_id', userId)
        .eq('is_read', false)
      setUnread(0)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Bell className="w-[18px] h-[18px] text-white/60" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-fuchsia-500 rounded-full ring-2 ring-black" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-zinc-950 border border-purple-900/30 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-white font-bold text-sm">Notifications</h3>
            {notifs.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-white/30">
                <Check className="w-3 h-3" />
                Tout lu
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="w-5 h-5 border-2 border-white/15 border-t-fuchsia-400 rounded-full animate-spin" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-xs">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05] max-h-72 overflow-y-auto">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 ${!n.is_read ? 'bg-fuchsia-500/5' : ''}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-fuchsia-500 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs leading-relaxed">{n.message}</p>
                    <p className="text-white/25 text-[10px] mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
