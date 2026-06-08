'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck, Star, MapPin, Phone, Globe, AtSign,
  Share2, CalendarDays, Clock, ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import type { Venue, EventWithVenue } from '@/lib/types'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'
import FollowButton from '@/components/FollowButton'

type Tab = 'events' | 'about'

// ─── Star rating ──────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-zinc-700 fill-zinc-700'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: EventWithVenue }) {
  const price = formatPrice(event.price_min, event.currency, event.is_free)
  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex items-center gap-3 bg-zinc-900 border border-purple-900/30 rounded-2xl overflow-hidden hover:border-purple-500/30 active:scale-[0.98] transition-all"
    >
      <div className="relative w-[72px] h-[72px] shrink-0 bg-gradient-to-br from-purple-900 to-violet-900">
        {event.cover_image && (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover"
            sizes="72px"
          />
        )}
      </div>
      <div className="flex-1 min-w-0 py-2">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-1 group-hover:text-violet-200 transition-colors">
          {event.title}
        </h3>
        <p className="text-zinc-400 text-xs mt-0.5 flex items-center gap-1.5">
          <CalendarDays className="w-3 h-3 shrink-0" />
          {formatDate(event.event_date)}
          <span className="text-zinc-600">·</span>
          <Clock className="w-3 h-3 shrink-0" />
          {formatTime(event.start_time)}
        </p>
        <p className={`text-xs font-semibold mt-0.5 ${event.is_free ? 'text-cyan-400' : 'text-amber-400'}`}>
          {price || '—'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0 mr-3" />
    </Link>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  venue: Venue
  events: EventWithVenue[]
}

export default function OrganizerContent({ venue, events }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('events')
  const [shareToast, setShareToast] = useState(false)

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href).catch(() => {})
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2200)
  }

  return (
    <div className="min-h-screen">

      {/* ── Banner ── */}
      <div className="relative h-[200px] w-full overflow-hidden bg-gradient-to-br from-purple-900 via-violet-900 to-black">
        {venue.cover_image && (
          <Image
            src={venue.cover_image}
            alt={venue.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080F] via-[#08080F]/25 to-transparent" />

        {/* Share button — top right */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur border border-white/10 px-3 py-2 rounded-full text-white text-xs font-medium hover:bg-black/70 transition-all"
        >
          {shareToast
            ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copié !</>
            : <><Share2 className="w-3.5 h-3.5" /> Partager</>}
        </button>

        {/* Avatar overlapping banner */}
        <div className="absolute bottom-0 left-4 translate-y-[40%] z-10">
          <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-br from-purple-500 to-cyan-400 shadow-2xl">
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-3xl font-black select-none">
              {venue.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile header ── */}
      <div className="px-4 pt-14 pb-2">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl font-black text-white leading-tight"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {venue.name}
              </h1>
              {venue.is_verified && (
                <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0" aria-label="Vérifié" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                {venue.category}
              </span>
              {(venue.rating ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <Stars rating={venue.rating!} />
                  <span className="text-zinc-400 text-xs">
                    {venue.rating}
                    {venue.review_count ? <span className="text-zinc-600"> ({venue.review_count})</span> : null}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Follow button + follower count */}
          <FollowButton followingId={venue.id} followingType="venue" showCount />
        </div>

        {/* Short description */}
        {venue.description && (
          <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
            {venue.description}
          </p>
        )}

        {/* Contact row */}
        {(venue.phone || venue.instagram || venue.website) && (
          <div className="flex flex-wrap gap-4 mb-3">
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors">
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                {venue.phone}
              </a>
            )}
            {venue.instagram && (
              <a
                href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                <AtSign className="w-3.5 h-3.5 text-purple-400" />
                {venue.instagram.startsWith('@') ? venue.instagram : `@${venue.instagram}`}
              </a>
            )}
            {venue.website && (
              <a
                href={venue.website}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                Site web
              </a>
            )}
          </div>
        )}

        {/* Address */}
        {venue.address && (
          <div className="flex items-start gap-2 text-zinc-500 text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
            <span>{venue.address}{venue.city ? `, ${venue.city}` : ''}</span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 mt-4 border-b border-white/5">
        <div className="flex gap-6">
          {(['events', 'about'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'events'
                ? `Événements${events.length > 0 ? ` (${events.length})` : ''}`
                : 'À propos'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 py-5">

        {/* Events tab */}
        {activeTab === 'events' && (
          events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <CalendarDays className="w-12 h-12 text-purple-400/20 mb-3" />
              <p className="text-zinc-500 text-sm font-medium">Aucun événement à venir</p>
              <p className="text-zinc-600 text-xs mt-1">Revenez bientôt pour voir les prochaines soirées.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map(event => <EventRow key={event.id} event={event} />)}
            </div>
          )
        )}

        {/* About tab */}
        {activeTab === 'about' && (
          <div className="space-y-5">
            {venue.description && (
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">À propos</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{venue.description}</p>
              </div>
            )}
            {venue.opening_hours && (
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Horaires</p>
                <p className="text-zinc-300 text-sm">{venue.opening_hours}</p>
              </div>
            )}
            {venue.address && (
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Adresse</p>
                <div className="flex items-start gap-2 text-zinc-300 text-sm">
                  <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>{venue.address}, {venue.city}</span>
                </div>
              </div>
            )}
            {(venue.rating ?? 0) > 0 && (
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Note</p>
                <div className="flex items-center gap-2">
                  <Stars rating={venue.rating!} />
                  <span className="text-white font-semibold text-sm">{venue.rating}</span>
                  {venue.review_count ? (
                    <span className="text-zinc-500 text-xs">({venue.review_count} avis)</span>
                  ) : null}
                </div>
              </div>
            )}
            {(venue.phone || venue.instagram || venue.website) && (
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Contact</p>
                <div className="space-y-2.5">
                  {venue.phone && (
                    <a href={`tel:${venue.phone}`} className="flex items-center gap-3 text-zinc-300 hover:text-white text-sm transition-colors">
                      <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                      {venue.phone}
                    </a>
                  )}
                  {venue.instagram && (
                    <a href={`https://instagram.com/${venue.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-zinc-300 hover:text-white text-sm transition-colors">
                      <AtSign className="w-4 h-4 text-purple-400 shrink-0" />
                      {venue.instagram.startsWith('@') ? venue.instagram : `@${venue.instagram}`}
                    </a>
                  )}
                  {venue.website && (
                    <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-zinc-300 hover:text-white text-sm transition-colors">
                      <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                      {venue.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="pb-28 md:pb-10 text-center pt-2">
        <p className="text-xs bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Powered by AMDY LABS
        </p>
      </div>
    </div>
  )
}
