'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Story } from '@/lib/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import StoryViewer from './StoryViewer'
import AddStoryModal from './AddStoryModal'

export type StoryGroup = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  stories: Story[]
  hasUnseen: boolean
}

function initials(name: string | null | undefined, email?: string): string {
  const n = name || email?.split('@')[0] || '?'
  return n.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function StoriesRow() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [viewerGroup, setViewerGroup] = useState<StoryGroup | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const fetchStories = useCallback(async () => {
    const now = new Date().toISOString()
    const { data: storiesData } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })

    if (!storiesData?.length) { setGroups([]); return }

    const userIds = Array.from(new Set((storiesData as Story[]).map((s) => s.user_id)))
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    type ProfileEntry = { id: string; full_name: string | null; avatar_url: string | null }
    const profileMap = new Map(
      ((profilesData ?? []) as ProfileEntry[]).map((p) => [p.id, p])
    )
    const map = new Map<string, StoryGroup>()

    for (const s of storiesData as Story[]) {
      if (!map.has(s.user_id)) {
        const p = profileMap.get(s.user_id)
        map.set(s.user_id, {
          user_id: s.user_id,
          full_name: p?.full_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          stories: [],
          hasUnseen: false,
        })
      }
      const grp = map.get(s.user_id)!
      grp.stories.push(s)
      if (!s.views.includes(user?.id ?? '\0')) grp.hasUnseen = true
    }

    const arr = Array.from(map.values())
    const myGroup = arr.find((g) => g.user_id === user?.id)
    const others = arr
      .filter((g) => g.user_id !== user?.id)
      .sort((a, b) => Number(b.hasUnseen) - Number(a.hasUnseen))

    setGroups(myGroup ? [myGroup, ...others] : others)
  }, [user])

  useEffect(() => { fetchStories() }, [fetchStories])

  const handleUserBubble = () => {
    if (!user) { window.location.href = '/sign-in'; return }
    const myGroup = groups.find((g) => g.user_id === user.id)
    if (myGroup) setViewerGroup(myGroup)
    else setShowAdd(true)
  }

  const myGroup = groups.find((g) => g.user_id === user?.id)
  const hasMyStory = Boolean(myGroup)
  const otherGroups = groups.filter((g) => g.user_id !== user?.id)

  // Don't render the row if there are no stories and the user isn't logged in
  // (no reason to show an empty row)
  if (!user && otherGroups.length === 0) return null

  return (
    <>
      <div
        className="flex gap-4 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Current-user bubble — always shown when logged in */}
        {user && (
          <button
            onClick={handleUserBubble}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="relative">
              <div
                className={`w-[62px] h-[62px] rounded-full p-[2.5px] ${
                  hasMyStory
                    ? 'bg-gradient-to-br from-fuchsia-500 to-cyan-500'
                    : 'bg-zinc-700'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#08080F] flex items-center justify-center overflow-hidden">
                  {(user.user_metadata?.avatar_url as string | undefined) ? (
                    <Image
                      src={user.user_metadata.avatar_url as string}
                      alt="Vous"
                      width={58}
                      height={58}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black text-white select-none">
                      {initials(user.user_metadata?.full_name as string | undefined, user.email)}
                    </span>
                  )}
                </div>
              </div>
              {/* + badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-[#08080F]">
                <Plus className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] text-white/40 max-w-[64px] truncate text-center leading-none">
              Votre story
            </span>
          </button>
        )}

        {/* Other users' stories */}
        {otherGroups.map((group) => (
          <button
            key={group.user_id}
            onClick={() => setViewerGroup(group)}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div
              className={`w-[62px] h-[62px] rounded-full p-[2.5px] ${
                group.hasUnseen
                  ? 'bg-gradient-to-br from-fuchsia-500 to-cyan-500'
                  : 'bg-zinc-700/60'
              }`}
            >
              <div className="w-full h-full rounded-full bg-[#08080F] overflow-hidden flex items-center justify-center">
                {group.avatar_url ? (
                  <Image
                    src={group.avatar_url}
                    alt={group.full_name ?? ''}
                    width={58}
                    height={58}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-black text-white select-none">
                    {initials(group.full_name)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-white/40 max-w-[64px] truncate text-center leading-none">
              {group.full_name?.split(' ')[0] ?? 'Utilisateur'}
            </span>
          </button>
        ))}
      </div>

      {/* Thin divider between stories and filter chips */}
      <div className="mx-4 h-px bg-white/5 mb-1" />

      {viewerGroup && (
        <StoryViewer
          group={viewerGroup}
          currentUserId={user?.id}
          onClose={() => { setViewerGroup(null); fetchStories() }}
        />
      )}

      {showAdd && user && (
        <AddStoryModal
          userId={user.id}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchStories() }}
        />
      )}
    </>
  )
}
