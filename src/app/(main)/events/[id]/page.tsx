import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { EventWithVenue } from '@/lib/types'
import { formatDate, formatTime, formatPrice, CATEGORY_COLORS } from '@/lib/utils'
import AttendanceButtons from '@/components/events/AttendanceButtons'

export const revalidate = 60

type GoingAvatar = { id: string; full_name: string | null; avatar_url: string | null }

async function getEvent(id: string): Promise<EventWithVenue | null> {
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('id', id)
    .single()
  return data as EventWithVenue | null
}

async function getAttendanceCounts(eventId: string): Promise<{ going: number; interested: number }> {
  const { data } = await supabase
    .from('event_attendance')
    .select('status')
    .eq('event_id', eventId)
  const rows = (data ?? []) as { status: string }[]
  return {
    going:      rows.filter((r) => r.status === 'going').length,
    interested: rows.filter((r) => r.status === 'interested').length,
  }
}

async function getGoingAvatars(eventId: string): Promise<GoingAvatar[]> {
  const { data: rows } = await supabase
    .from('event_attendance')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'going')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!rows?.length) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', (rows as { user_id: string }[]).map((r) => r.user_id))

  return (profiles ?? []) as GoingAvatar[]
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Nightlife:   'from-violet-900 via-purple-900 to-black',
  Jazz:        'from-amber-900 via-orange-900 to-black',
  Culture:     'from-emerald-900 via-teal-900 to-black',
  Rooftop:     'from-sky-900 via-blue-900 to-black',
  Underground: 'from-rose-900 via-red-900 to-black',
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, counts, avatars] = await Promise.all([
    getEvent(params.id),
    getAttendanceCounts(params.id),
    getGoingAvatars(params.id),
  ])

  if (!event) notFound()

  const gradient  = CATEGORY_GRADIENTS[event.category] ?? 'from-gray-900 to-black'
  const badgeClass = CATEGORY_COLORS[event.category]  ?? 'bg-white/10 text-white/60 border-white/10'
  const price     = formatPrice(event.price_min, event.currency, event.is_free)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className={`relative h-64 md:h-80 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070f] via-black/30 to-transparent" />
        <div className="absolute top-8 right-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-8 left-8 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

        {/* Back button */}
        <Link
          href="/events"
          className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </Link>

        <div className="absolute bottom-6 left-4 right-4 md:left-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeClass}`}>
              {event.category}
            </span>
            {event.is_featured && (
              <span className="bg-rose-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">{event.title}</h1>
          <p className="text-white/50 text-sm mt-1">
            {formatDate(event.event_date)} · {formatTime(event.start_time)}
            {event.end_time && ` – ${formatTime(event.end_time)}`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6 max-w-2xl">

        {/* ── Attendance buttons — Going / Interested ── */}
        <AttendanceButtons
          eventId={event.id}
          initialGoingCount={counts.going}
          initialInterestedCount={counts.interested}
          goingAvatars={avatars}
        />

        {/* Key info cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Date</p>
            <p className="text-white font-semibold text-sm capitalize">{formatDate(event.event_date)}</p>
          </div>
          <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Heure</p>
            <p className="text-white font-semibold text-sm">
              {formatTime(event.start_time)}
              {event.end_time && ` – ${formatTime(event.end_time)}`}
            </p>
          </div>
          <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Entrée</p>
            <p className={`font-semibold text-sm ${event.is_free ? 'text-emerald-400' : 'text-white'}`}>
              {price || '—'}
            </p>
          </div>
          <div className="bg-white/5 border border-white/[0.06] rounded-2xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Ville</p>
            <p className="text-white font-semibold text-sm">{event.city}</p>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">À propos</h2>
            <p className="text-white/70 text-sm leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Venue */}
        {event.venues && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Lieu</h2>
            <Link
              href={`/venues/${event.venues.id}`}
              className="flex items-center gap-4 bg-white/5 border border-white/[0.06] hover:border-violet-500/30 rounded-2xl p-4 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-800/60 to-purple-900/60 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm group-hover:text-violet-200 transition-colors">
                  {event.venues.name}
                </p>
                {event.venues.address && (
                  <p className="text-white/40 text-xs mt-0.5 truncate">{event.venues.address}</p>
                )}
                <p className="text-white/30 text-xs">{event.venues.category}</p>
              </div>
              <svg className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* CTA */}
        <button className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)] text-sm tracking-wide">
          {event.is_free ? 'Participer — Gratuit' : `Réserver · ${price}`}
        </button>
      </div>
    </div>
  )
}
