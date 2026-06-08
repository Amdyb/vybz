'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Send, Paperclip, X, Camera,
  CalendarDays, MapPin, Loader2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Message, Conversation } from '@/lib/types'

type Profile = { id: string; full_name: string | null; avatar_url: string | null }
type EventSnippet = { id: string; title: string; event_date: string; cover_image: string | null; venues: { name: string } | null }
type VenueSnippet = { id: string; name: string; category: string; cover_image: string | null }

const PAGE = 50

function initials(name: string | null): string {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const m = msg.metadata

  const bubbleBase = `max-w-[75%] rounded-2xl text-sm`
  const ownStyle   = 'bg-gradient-to-br from-fuchsia-600 to-purple-700 text-white rounded-br-sm'
  const theirStyle = 'bg-zinc-800 text-white/90 rounded-bl-sm'

  return (
    <div className={`flex mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div>
        {/* Text */}
        {msg.message_type === 'text' && (
          <div className={`${bubbleBase} px-4 py-2.5 ${isOwn ? ownStyle : theirStyle}`}>
            <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        )}

        {/* Image */}
        {msg.message_type === 'image' && m.media_url && (
          <div className="rounded-2xl overflow-hidden max-w-[220px]">
            <Image
              src={String(m.media_url)}
              alt="Image"
              width={220}
              height={165}
              className="object-cover w-full"
            />
          </div>
        )}

        {/* Event link */}
        {msg.message_type === 'event_link' && (
          <Link
            href={`/events/${m.event_id}`}
            className="block bg-zinc-800 border border-purple-900/30 rounded-2xl overflow-hidden w-[220px] hover:border-fuchsia-500/30 transition-colors"
          >
            <div className="relative h-28 bg-gradient-to-br from-fuchsia-900 to-purple-900">
              {m.cover_image && (
                <Image src={String(m.cover_image)} alt="" fill className="object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-white text-xs font-bold line-clamp-2">{String(m.event_title ?? '')}</p>
              </div>
            </div>
            <div className="px-3 py-2 flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3 text-fuchsia-400 shrink-0" />
              <p className="text-white/50 text-[10px] truncate">{String(m.event_date ?? '')} · {String(m.venue_name ?? '')}</p>
            </div>
          </Link>
        )}

        {/* Venue link */}
        {msg.message_type === 'venue_link' && (
          <Link
            href={`/venues/${m.venue_id}`}
            className="block bg-zinc-800 border border-purple-900/30 rounded-2xl overflow-hidden w-[220px] hover:border-fuchsia-500/30 transition-colors"
          >
            <div className="relative h-24 bg-gradient-to-br from-violet-900 to-purple-900">
              {m.cover_image && (
                <Image src={String(m.cover_image)} alt="" fill className="object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
            <div className="px-3 py-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-fuchsia-400 shrink-0" />
              <p className="text-white text-xs font-bold truncate">{String(m.venue_name ?? '')}</p>
            </div>
          </Link>
        )}

        {/* Time + read receipt */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-white/20">{formatTime(msg.created_at)}</span>
          {isOwn && msg.is_read && (
            <span className="text-[10px] text-fuchsia-400/60">Lu</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Attach sheet ─────────────────────────────────────────────────────────────

function AttachSheet({
  onClose,
  onSendEvent,
  onSendVenue,
  onSendImage,
  userId,
}: {
  onClose: () => void
  onSendEvent: (ev: EventSnippet) => void
  onSendVenue: (v: VenueSnippet) => void
  onSendImage: (file: File) => void
  userId: string
}) {
  const [tab, setTab]           = useState<'events' | 'venues'>('events')
  const [events, setEvents]     = useState<EventSnippet[]>([])
  const [venues, setVenues]     = useState<VenueSnippet[]>([])
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tab === 'events') {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      supabase
        .from('events')
        .select('id, title, event_date, cover_image, venues(name)')
        .eq('status', 'published')
        .gte('event_date', today)
        .ilike('title', query ? `%${query}%` : '%')
        .order('event_date', { ascending: true })
        .limit(8)
        .then(({ data }) => { setEvents((data ?? []) as EventSnippet[]); setLoading(false) })
    } else {
      setLoading(true)
      supabase
        .from('venues')
        .select('id, name, category, cover_image')
        .ilike('name', query ? `%${query}%` : '%')
        .limit(8)
        .then(({ data }) => { setVenues((data ?? []) as VenueSnippet[]); setLoading(false) })
    }
  }, [tab, query, userId])

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-950 border-t border-purple-900/30 rounded-t-3xl max-h-[70vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-0.5">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
          <h3 className="text-white font-black text-sm">Partager</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/5 shrink-0">
          {(['events', 'venues'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                tab === t ? 'border-fuchsia-500 text-white' : 'border-transparent text-white/40'
              }`}
            >
              {t === 'events' ? 'Événements' : 'Lieux'}
            </button>
          ))}
          {/* Photo button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2.5 text-xs font-semibold text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            Photo
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 shrink-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'events' ? 'Chercher un événement...' : 'Chercher un lieu...'}
            className="w-full bg-zinc-900 border border-purple-900/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
          ) : tab === 'events' ? (
            events.map((ev) => (
              <button key={ev.id} onClick={() => { onSendEvent(ev); onClose() }}
                className="w-full flex items-center gap-3 py-2.5 hover:bg-white/5 rounded-xl px-2 -mx-2 transition-colors">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                  {ev.cover_image && <Image src={ev.cover_image} alt="" width={40} height={40} className="object-cover w-full h-full" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{ev.title}</p>
                  <p className="text-white/35 text-[10px]">{ev.event_date} · {ev.venues?.name}</p>
                </div>
              </button>
            ))
          ) : (
            venues.map((v) => (
              <button key={v.id} onClick={() => { onSendVenue(v); onClose() }}
                className="w-full flex items-center gap-3 py-2.5 hover:bg-white/5 rounded-xl px-2 -mx-2 transition-colors">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                  {v.cover_image && <Image src={v.cover_image} alt="" width={40} height={40} className="object-cover w-full h-full" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{v.name}</p>
                  <p className="text-white/35 text-[10px]">{v.category}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) { onSendImage(f); onClose() } }}
        />
        <div className="h-4" />
      </div>
    </div>
  )
}

// ─── Main ChatView ────────────────────────────────────────────────────────────

export default function ChatView({ conversationId }: { conversationId: string }) {
  const router = useRouter()
  const [userId, setUserId]     = useState<string | null>(null)
  const [otherUser, setOther]   = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [loadingMore, setLMore] = useState(false)
  const [hasMore, setHasMore]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [attach, setAttach]     = useState(false)
  const [uploadingImg, setUpImg] = useState(false)
  const endRef    = useRef<HTMLDivElement>(null)
  const topRef    = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const firstLoad = useRef(true)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/sign-in'); return }
      setUserId(session.user.id)

      // Get conversation participants
      const { data: convData } = await supabase
        .from('conversations')
        .select('participant_1_id, participant_2_id')
        .eq('id', conversationId)
        .single()

      const conv = convData as Pick<Conversation, 'participant_1_id' | 'participant_2_id'> | null
      if (!conv) { router.replace('/messages'); return }

      const otherId = conv.participant_1_id === session.user.id
        ? conv.participant_2_id
        : conv.participant_1_id

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', otherId)
        .single()
      setOther((profile as unknown as Profile) ?? { id: otherId, full_name: 'Utilisateur', avatar_url: null })

      // Load initial messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE)
      const sorted = ((msgs ?? []) as Message[]).reverse()
      setMessages(sorted)
      setHasMore((msgs?.length ?? 0) === PAGE)
      setLoading(false)

      // Mark all received messages as read
      await supabase
        .from('messages')
        .update({ is_read: true } as never)
        .eq('conversation_id', conversationId)
        .neq('sender_id', session.user.id)
        .eq('is_read', false)
    })
  }, [conversationId, router])

  // Scroll to bottom on first load
  useEffect(() => {
    if (!loading && firstLoad.current) {
      firstLoad.current = false
      endRef.current?.scrollIntoView()
    }
  }, [loading])

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const msg = payload.new as Message
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev
              return [...prev, msg]
            })
            // Mark incoming as read immediately
            if (msg.sender_id !== userId) {
              supabase.from('messages').update({ is_read: true } as never).eq('id', msg.id)
              endRef.current?.scrollIntoView({ behavior: 'smooth' })
            } else {
              endRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((m) => m.id === payload.new.id ? (payload.new as Message) : m)
            )
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, userId])

  // ── Load older messages ───────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !messages.length) return
    setLMore(true)
    const oldest = messages[0].created_at
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE)
    const older = ((data ?? []) as Message[]).reverse()
    setHasMore(older.length === PAGE)
    setMessages((prev) => [...older, ...prev])
    setLMore(false)
  }, [conversationId, hasMore, loadingMore, messages])

  // IntersectionObserver for top sentinel
  useEffect(() => {
    const el = topRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore()
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMsg = async (type = 'text', meta: Record<string, string> = {}, content = '') => {
    if (!userId) return
    if (type === 'text' && !input.trim()) return
    setSending(true)
    const body = {
      conversation_id: conversationId,
      sender_id: userId,
      content: type === 'text' ? input.trim() : content,
      message_type: type,
      metadata: meta,
    }
    const { data: newMsg } = await supabase.from('messages').insert(body as never).select().single()
    if (newMsg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === (newMsg as Message).id)) return prev
        return [...prev, newMsg as Message]
      })
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    if (type === 'text') setInput('')
    setSending(false)
  }

  const sendEvent = (ev: EventSnippet) => sendMsg('event_link', {
    event_id: ev.id,
    event_title: ev.title,
    event_date: ev.event_date,
    venue_name: ev.venues?.name ?? '',
    cover_image: ev.cover_image ?? '',
  })

  const sendVenue = (v: VenueSnippet) => sendMsg('venue_link', {
    venue_id: v.id,
    venue_name: v.name,
    cover_image: v.cover_image ?? '',
  })

  const sendImage = async (file: File) => {
    if (!userId) return
    setUpImg(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${conversationId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('messages').upload(path, file, { contentType: file.type })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('messages').getPublicUrl(path)
      await sendMsg('image', { media_url: publicUrl })
    }
    setUpImg(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#08080F]/95 backdrop-blur-sm shrink-0 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
          {otherUser?.avatar_url ? (
            <Image src={otherUser.avatar_url} alt={otherUser.full_name ?? ''} width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-black text-white">{initials(otherUser?.full_name ?? null)}</span>
          )}
        </div>
        <p className="text-white font-bold text-sm flex-1 truncate">{otherUser?.full_name ?? 'Conversation'}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Load more sentinel */}
        <div ref={topRef} className="h-4 flex justify-center items-center">
          {loadingMore && <Loader2 className="w-4 h-4 text-white/20 animate-spin" />}
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-white/25 text-sm">Commencez la conversation !</p>
          </div>
        )}

        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} isOwn={msg.sender_id === userId} />
        ))}

        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-white/5 bg-[#08080F] px-3 py-3 flex items-end gap-2">
        <button
          onClick={() => setAttach(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shrink-0 mb-0.5"
        >
          {uploadingImg
            ? <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
            : <Paperclip className="w-4 h-4 text-white/50" />}
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMsg()
            }
          }}
          placeholder="Message..."
          rows={1}
          className="flex-1 bg-zinc-900 border border-purple-900/30 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-fuchsia-500/40 resize-none overflow-hidden transition-colors"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        <button
          onClick={() => sendMsg()}
          disabled={!input.trim() || sending}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 disabled:opacity-40 active:scale-90 transition-all shrink-0 mb-0.5"
        >
          {sending
            ? <Loader2 className="w-4 h-4 text-white animate-spin" />
            : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Attach sheet */}
      {attach && userId && (
        <AttachSheet
          onClose={() => setAttach(false)}
          onSendEvent={sendEvent}
          onSendVenue={sendVenue}
          onSendImage={sendImage}
          userId={userId}
        />
      )}
    </div>
  )
}
