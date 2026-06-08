'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function MessagesIcon({ userId }: { userId: string }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    // Count unread received messages across all user's conversations
    // RLS ensures we only see messages from our conversations
    supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', userId)
      .then(({ count }) => setUnread(count ?? 0))
  }, [userId])

  return (
    <Link
      href="/messages"
      aria-label="Messages"
      className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
    >
      <MessageSquare className="w-[18px] h-[18px] text-white/60" />
      {unread > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-fuchsia-500 rounded-full ring-2 ring-black" />
      )}
    </Link>
  )
}
