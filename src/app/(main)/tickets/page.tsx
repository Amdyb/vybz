'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import {
  Ticket as TicketIcon,
  MapPin,
  Calendar,
  Clock,
  MessageCircle,
  Loader2,
  ChevronLeft,
  Gift,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { TicketWithDetails, RewardClaimWithReward } from '@/lib/types'
import RewardClaimCard from '@/components/RewardClaimCard'
import { formatDate, formatTime } from '@/lib/utils'

// ─── Status badge ─────────────────────────────────────────────────────────────

type TicketStatus = 'UNUSED' | 'USED' | 'CANCELLED' | 'EXPIRED'

const STATUS_CONFIG: Record<TicketStatus, { label: string; classes: string }> = {
  UNUSED:    { label: 'VALIDE',   classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  USED:      { label: 'UTILISÉ', classes: 'bg-zinc-700/60   text-zinc-400    border-zinc-600/40' },
  CANCELLED: { label: 'ANNULÉ',  classes: 'bg-red-500/15    text-red-400     border-red-500/30' },
  EXPIRED:   { label: 'EXPIRÉ',  classes: 'bg-red-500/15    text-red-400     border-red-500/30' },
}

function StatusBadge({ status }: { status: string | null }) {
  const key = (status ?? 'UNUSED').toUpperCase() as TicketStatus
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG.UNUSED
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// ─── Ticket card ─────────────────────────────────────────────────────────────

function TicketCard({ ticket, buyerName }: { ticket: TicketWithDetails; buyerName: string }) {
  const event      = ticket.events
  const venue      = event?.venues
  const ticketType = ticket.ticket_types

  const isUsable = (ticket.status ?? 'UNUSED').toUpperCase() === 'UNUSED'

  return (
    <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl overflow-hidden shadow-lg">

      {/* ── Event header ── */}
      <div className="relative h-28 bg-gradient-to-br from-purple-900 via-violet-900 to-black">
        {event?.cover_image && (
          <Image
            src={event.cover_image}
            alt={event.title ?? ''}
            fill
            className="object-cover opacity-60"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-black/40 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={ticket.status} />
        </div>

        {/* Ticket type */}
        <div className="absolute bottom-3 left-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
            {ticketType?.name ?? 'Billet standard'}
          </span>
          <h3 className="text-white font-black text-base leading-tight line-clamp-1">
            {event?.title ?? '—'}
          </h3>
        </div>
      </div>

      {/* ── Event details ── */}
      <div className="px-4 pt-3 pb-0 space-y-1.5">
        {venue?.name && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span>{venue.name}{venue.city ? `, ${venue.city}` : ''}</span>
          </div>
        )}
        {event?.event_date && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-purple-400" />
              <span>{formatDate(event.event_date)}</span>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Clock className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <span>{formatTime(event.start_time)}</span>
              </div>
            )}
          </div>
        )}

        {/* Buyer name */}
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <TicketIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{buyerName}</span>
        </div>
      </div>

      {/* ── Dashed separator (torn ticket edge) ── */}
      <div className="mx-4 my-4 border-t border-dashed border-white/10" />

      {/* ── QR Code ── */}
      <div className="flex flex-col items-center pb-5 px-4">
        <div
          className={`p-4 rounded-2xl bg-white shadow-lg ${!isUsable ? 'opacity-40 grayscale' : ''}`}
          aria-label="QR Code"
        >
          <QRCodeSVG
            value={ticket.qr_token}
            size={180}
            level="H"
            bgColor="#ffffff"
            fgColor="#09090b"
          />
        </div>
        {!isUsable && (
          <p className="mt-2 text-xs text-zinc-500">
            Ce ticket n&apos;est plus valide
          </p>
        )}

        {/* Ticket token (short) */}
        <p className="mt-3 text-[10px] text-zinc-600 font-mono tracking-widest">
          #{ticket.qr_token.slice(0, 16).toUpperCase()}
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets]   = useState<TicketWithDetails[]>([])
  const [rewardClaims, setRewardClaims] = useState<RewardClaimWithReward[]>([])
  const [tab, setTab]           = useState<'billets' | 'recompenses'>('billets')
  const [loading, setLoading]   = useState(true)
  const [userName, setUserName] = useState('Acheteur')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }

      // Resolve display name: profile → auth metadata → email prefix
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split('@')[0] ||
        'Acheteur'

      const [ticketsRes, profileRes, rewardsRes] = await Promise.all([
        supabase
          .from('tickets')
          .select(`
            *,
            events(title, event_date, start_time, cover_image,
              venues(name, city, address)
            ),
            ticket_types(name, price, currency)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('reward_claims')
          .select('*, rewards(id, title, description, points_required, expires_at, profiles(full_name, business_name), events(title))')
          .eq('user_id', user.id)
          .order('claimed_at', { ascending: false }),
      ])

      setRewardClaims((rewardsRes.data ?? []) as unknown as RewardClaimWithReward[])

      const profileData = profileRes.data as { full_name?: string | null } | null
      if (profileData?.full_name) {
        setUserName(profileData.full_name)
      } else {
        setUserName(displayName)
      }

      if (ticketsRes.data) {
        setTickets(ticketsRes.data as unknown as TicketWithDetails[])
      }

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-purple-900/30 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1
            className="text-xl font-black text-white"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Mes Billets
          </h1>
          <p className="text-zinc-500 text-xs">
            {tickets.length} {tickets.length === 1 ? 'billet' : 'billets'} · {rewardClaims.length} récompense{rewardClaims.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('billets')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
            tab === 'billets'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
              : 'bg-zinc-900 border border-purple-900/30 text-white/50 hover:text-white/80'
          }`}
        >
          <TicketIcon className="w-4 h-4" /> Billets
        </button>
        <button
          onClick={() => setTab('recompenses')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
            tab === 'recompenses'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
              : 'bg-zinc-900 border border-amber-900/30 text-white/50 hover:text-white/80'
          }`}
        >
          <Gift className="w-4 h-4" /> Récompenses
        </button>
      </div>

      {/* ── Récompenses tab ── */}
      {tab === 'recompenses' && (
        rewardClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-amber-900/30 flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-amber-400/50" />
            </div>
            <h2 className="text-white font-bold mb-2">Aucune récompense</h2>
            <p className="text-zinc-500 text-sm max-w-xs">Échange tes Pulse Points contre des récompenses exclusives.</p>
            <Link href="/rewards" className="mt-6 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-sm font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              Voir les récompenses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rewardClaims.filter((c) => c.rewards).map((c) => (
              <RewardClaimCard
                key={c.id}
                title={c.rewards!.title}
                organizer={c.rewards!.profiles?.business_name || c.rewards!.profiles?.full_name || null}
                eventName={c.rewards!.events?.title ?? null}
                qrToken={c.qr_token}
                status={c.status}
                expiresAt={c.rewards!.expires_at}
                pointsRequired={c.rewards!.points_required}
              />
            ))}
          </div>
        )
      )}

      {/* ── Billets tab ── */}
      {tab === 'billets' && (
      tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-purple-900/30 flex items-center justify-center mb-4">
            <TicketIcon className="w-8 h-8 text-purple-400/50" />
          </div>
          <h2 className="text-white font-bold mb-2">Aucun ticket pour le moment</h2>
          <p className="text-zinc-500 text-sm max-w-xs">
            Tes billets apparaîtront ici après confirmation de paiement par l&apos;organisateur.
          </p>
          <Link
            href="/events"
            className="mt-6 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Découvrir des événements
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} buyerName={userName} />
          ))}
        </div>
      )
      )}

      {/* WhatsApp delivery note — billets only */}
      {tab === 'billets' && (
        <div className="mt-8 px-4 py-4 rounded-2xl bg-zinc-900/60 border border-purple-900/20 flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <p className="text-zinc-400 text-xs leading-relaxed">
            Votre ticket vous sera envoyé sur{' '}
            <span className="text-green-400 font-semibold">WhatsApp</span>{' '}
            après confirmation de paiement par l&apos;organisateur.
            Le paiement et la livraison des billets sont gérés directement par l&apos;organisateur.
          </p>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}
