'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StoryGroup } from './StoriesRow'

interface Props {
  group: StoryGroup
  currentUserId?: string
  onClose: () => void
}

const DURATION = 5000 // ms per story

export default function StoryViewer({ group, currentUserId, onClose }: Props) {
  const { stories } = group

  const [index, setIndex] = useState(() => {
    const first = stories.findIndex((s) => !s.views.includes(currentUserId ?? '\0'))
    return first >= 0 ? first : 0
  })
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null)
  const seenRef = useRef<Set<string>>(new Set())

  // Keep latest index/onClose in refs so the timer closure is always fresh
  const indexRef = useRef(index)
  const onCloseRef = useRef(onClose)
  useEffect(() => { indexRef.current = index }, [index])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i < stories.length - 1) return i + 1
      onCloseRef.current()
      return i
    })
  }, [stories.length])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  // Mark story as seen via security-definer RPC
  useEffect(() => {
    const story = stories[index]
    if (!currentUserId || !story || seenRef.current.has(story.id)) return
    seenRef.current.add(story.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabase.rpc as any)('add_story_view', {
      p_story_id: story.id,
      p_viewer_id: currentUserId,
    })
  }, [index, currentUserId, stories])

  // Progress timer — resets whenever index or paused changes
  useEffect(() => {
    setProgress(0)
    if (paused) return

    let elapsed = 0
    const id = setInterval(() => {
      elapsed += 100
      setProgress(Math.min((elapsed / DURATION) * 100, 100))
      if (elapsed >= DURATION) {
        clearInterval(id)
        if (indexRef.current < stories.length - 1) {
          setIndex((i) => i + 1)
        } else {
          onCloseRef.current()
        }
      }
    }, 100)

    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, stories.length])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goNext, goPrev])

  // ── Touch handlers ──────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() }
    setPaused(true) // hold to pause
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setPaused(false)
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    const dt = Date.now() - touchStart.current.t
    touchStart.current = null

    // Swipe down to close
    if (dy > 80 && Math.abs(dx) < 60) { onClose(); return }

    // Short tap → navigate
    if (dt < 220 && Math.abs(dy) < 30) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      if (t.clientX < rect.left + rect.width / 2) goPrev()
      else goNext()
    }
  }

  // Desktop click navigation
  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (e.clientX < rect.left + rect.width / 2) goPrev()
    else goNext()
  }

  const story = stories[index]

  const timeAgo = (() => {
    const diff = Date.now() - new Date(story.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'maintenant'
    if (mins < 60) return `il y a ${mins}m`
    return `il y a ${Math.floor(mins / 60)}h`
  })()

  return (
    <div className="fixed inset-0 z-[100] bg-black select-none touch-none">
      {/* Full-screen tap / swipe target */}
      <div
        className="absolute inset-0"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* Media */}
      {story.media_url && (
        <Image
          src={story.media_url}
          alt="Story"
          fill
          className="object-cover pointer-events-none"
          sizes="100vw"
          priority
        />
      )}

      {/* Top + bottom scrim for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/30 pointer-events-none" />

      {/* ── Progress bars ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 px-3 pt-3 pb-1 pointer-events-none">
        {stories.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full"
              style={{
                width:
                  i < index
                    ? '100%'
                    : i === index
                    ? `${progress}%`
                    : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Header: avatar + name + time + close ── */}
      <div className="absolute top-7 left-0 right-0 z-10 flex items-center gap-3 px-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-[1.5px] shrink-0 pointer-events-none">
          <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
            {group.avatar_url ? (
              <Image
                src={group.avatar_url}
                alt=""
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-[11px] font-black text-white">
                {(group.full_name ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 pointer-events-none">
          <p className="text-white text-sm font-bold truncate leading-tight">
            {group.full_name ?? 'Utilisateur'}
          </p>
          <p className="text-white/45 text-[11px]">{timeAgo}</p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white active:scale-90 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
