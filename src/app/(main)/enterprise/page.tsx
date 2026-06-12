'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Ticket, TrendingUp, CalendarCheck, Users,
  PlusCircle, ScanLine, BarChart3,
  CheckCircle2, Loader2, ShieldCheck, Crown, Star,
  MapPin, Clock, ChevronRight, Zap, Gift,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'

// ─── Local types for the dashboard queries ────────────────────────────────────

type OrgEvent = {
  id: string
  title: string
  event_date: string
  start_time: string
  cover_image: string | null
  status: string | null
  capacity: number | null
  category: string
  currency: string | null
  tickets: { id: string }[]
  orders: { id: string; total_amount: number; currency: string | null }[]
}

type RecentOrder = {
  id: string
  total_amount: number
  currency: string | null
  status: string | null
  created_at: string | null
  ticket_types: { name: string } | null
  events: { title: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function planMeta(plan: string | null) {
  switch (plan) {
    case 'pro':
      return { label: 'Pro', icon: Star, classes: 'bg-purple-500/15 text-purple-300 border-purple-500/30' }
    case 'premium':
      return { label: 'Premium', icon: Crown, classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
    default:
      return { label: 'Basic', icon: Zap, classes: 'bg-zinc-700/50 text-zinc-300 border-zinc-600/40' }
  }
}

function eventStatusMeta(event: OrgEvent) {
  const today = new Date().toISOString().split('T')[0]
  if (event.status === 'draft')      return { label: 'Brouillon', classes: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40' }
  if (event.status === 'cancelled')  return { label: 'Annulé',    classes: 'bg-red-500/15 text-red-400 border-red-500/30' }
  if (event.event_date < today)      return { label: 'Terminé',   classes: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40' }
  return                                    { label: 'Publié',    classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
}

function fmtRevenue(amount: number, currency: string | null): string {
  if (amount === 0) return '0 ' + (currency ?? 'XOF')
  return amount.toLocaleString('fr-SN') + ' ' + (currency ?? 'XOF')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnterpriseDashboardPage() {
  const router = useRouter()
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [events, setEvents]         = useState<OrgEvent[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const p = profileData as Profile | null
      if (!p || p.role !== 'organizer') {
        router.replace('/enterprise/onboarding')
        return
      }
      setProfile(p)

      // Fetch organizer's events with nested ticket + order counts
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          id, title, event_date, start_time, cover_image,
          status, capacity, category, currency,
          tickets!tickets_event_id_fkey(id),
          orders!orders_event_id_fkey(id, total_amount, currency)
        `)
        .eq('organizer_id', user.id)
        .order('event_date', { ascending: false })
        .limit(30)

      const orgEvents = (eventsData ?? []) as unknown as OrgEvent[]
      setEvents(orgEvents)

      // Recent orders across all organizer events
      const eventIds = orgEvents.map(e => e.id)
      if (eventIds.length > 0) {
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            id, total_amount, currency, status, created_at,
            ticket_types!orders_ticket_type_id_fkey(name),
            events!orders_event_id_fkey(title)
          `)
          .in('event_id', eventIds)
          .order('created_at', { ascending: false })
          .limit(8)

        setRecentOrders((ordersData ?? []) as unknown as RecentOrder[])
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

  // ── Computed stats ──
  const today = new Date().toISOString().split('T')[0]
  const totalTickets   = events.reduce((s, e) => s + (e.tickets?.length ?? 0), 0)
  const totalRevenue   = events.reduce((s, e) =>
    s + (e.orders ?? []).reduce((rs, o) => rs + (o.total_amount ?? 0), 0), 0)
  const upcomingCount  = events.filter(e => e.event_date >= today && e.status === 'published').length
  const totalAttendees = totalTickets

  const plan = planMeta(profile?.subscription_plan ?? 'basic')
  const PlanIcon = plan.icon

  // Primary currency for revenue display
  const primaryCurrency = events[0]?.currency ?? 'XOF'

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
              {profile?.business_name ?? 'Mon espace'}
            </h1>
            {profile?.is_verified_organizer && (
              <ShieldCheck className="w-5 h-5 text-violet-400" aria-label="Organisateur vérifié" />
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${plan.classes}`}>
            <PlanIcon className="w-3 h-3" />
            Plan {plan.label}
          </span>
        </div>
        <Link href="/profile" className="text-zinc-500 hover:text-white transition-colors">
          <div className="w-9 h-9 rounded-full bg-zinc-900 border border-purple-900/30 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </div>
        </Link>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Billets vendus',    value: totalTickets,                     icon: Ticket,       color: 'text-purple-400' },
          { label: 'Revenus',           value: fmtRevenue(totalRevenue, primaryCurrency), icon: TrendingUp,   color: 'text-emerald-400', small: true },
          { label: 'Événements à venir', value: upcomingCount,                  icon: CalendarCheck, color: 'text-cyan-400' },
          { label: 'Participants',      value: totalAttendees,                   icon: Users,         color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color, small }) => (
          <div key={label} className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className={`font-black text-white mb-0.5 ${small ? 'text-base leading-tight' : 'text-2xl'}`}>
              {value}
            </div>
            <div className="text-zinc-500 text-[11px]">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'Nouvel événement', icon: PlusCircle,  href: '/enterprise/create-event',  color: 'text-purple-400' },
          { label: 'Créer un Drop',    icon: Zap,          href: '/enterprise/create-drop',   color: 'text-amber-400' },
          { label: 'Récompense',       icon: Gift,         href: '/enterprise/create-reward', color: 'text-yellow-400' },
          { label: 'Scanner',          icon: ScanLine,     href: '/enterprise/scanner',       color: 'text-cyan-400' },
          { label: 'Analytiques',      icon: BarChart3,    href: '/enterprise/analytics',     color: 'text-emerald-400' },
        ].map(({ label, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-purple-900/30 hover:border-purple-500/30 hover:bg-zinc-800/50 active:scale-95 transition-all"
          >
            <Icon className={`w-6 h-6 ${color}`} />
            <span className="text-[11px] font-semibold text-zinc-400 text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── Events list ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider">
            Mes événements ({events.length})
          </h2>
          <Link href="/enterprise/create-event" className="text-purple-400 text-xs font-medium hover:text-purple-300 transition-colors">
            + Créer
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-zinc-900 border border-dashed border-purple-900/30 rounded-2xl p-8 text-center">
            <CalendarCheck className="w-10 h-10 text-purple-400/30 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm font-medium mb-1">Aucun événement créé</p>
            <p className="text-zinc-600 text-xs mb-4">Créez votre premier événement et commencez à vendre des billets.</p>
            <Link
              href="/enterprise/create-event"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-full"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Créer un événement
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => {
              const status       = eventStatusMeta(event)
              const ticketCount  = event.tickets?.length ?? 0
              const eventRevenue = (event.orders ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0)
              const pct          = event.capacity ? Math.min(100, Math.round((ticketCount / event.capacity) * 100)) : null

              return (
                <div key={event.id} className="bg-zinc-900 border border-purple-900/30 rounded-2xl overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {/* Cover */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-purple-900 to-violet-900">
                      {event.cover_image && (
                        <Image
                          src={event.cover_image}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-1 flex-1">{event.title}</h3>
                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-zinc-500 text-xs mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {formatDate(event.event_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.start_time)}
                        </span>
                      </div>

                      {/* Ticket fill bar */}
                      <div className="flex items-center gap-2">
                        <Ticket className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="text-zinc-400 text-xs">
                          {ticketCount}{event.capacity ? `/${event.capacity}` : ''} billets
                        </span>
                        {eventRevenue > 0 && (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span className="text-emerald-400 text-xs font-semibold">
                              {fmtRevenue(eventRevenue, event.currency)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Capacity progress bar */}
                  {pct !== null && (
                    <div className="px-3 pb-3">
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Recent orders ── */}
      {recentOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
            Commandes récentes
          </h2>
          <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl overflow-hidden divide-y divide-white/5">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">
                    {order.events?.title ?? 'Événement'}
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    {order.ticket_types?.name ?? 'Billet'} · {order.created_at ? formatDate(order.created_at.split('T')[0]) : '—'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-emerald-400 text-xs font-bold">
                    {fmtRevenue(order.total_amount ?? 0, order.currency)}
                  </p>
                  <p className={`text-[10px] font-semibold uppercase ${
                    order.status === 'paid' ? 'text-emerald-500' :
                    order.status === 'pending' ? 'text-amber-500' : 'text-zinc-500'
                  }`}>
                    {order.status === 'paid' ? 'Payé' : order.status === 'pending' ? 'En attente' : order.status ?? '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upgrade card (Basic only) ── */}
      {(!profile?.subscription_plan || profile.subscription_plan === 'basic') && (
        <div className="bg-gradient-to-br from-purple-900/40 to-cyan-900/20 border border-purple-500/30 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-black">Passez à Pro</span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed mb-4">
            Débloquez la vente de billets, le scanner QR, les analytiques et plus encore pour seulement{' '}
            <span className="text-white font-semibold">9 900 XOF/mois</span>.
          </p>
          <ul className="space-y-1 mb-4">
            {[
              'Vente de billets avec QR codes',
              'Scanner de billets à la porte',
              'Analytiques et suivi des revenus',
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/enterprise/subscription"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Mettre à niveau
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Manage subscription — for paid plans */}
      {profile?.subscription_plan && profile.subscription_plan !== 'basic' && (
        <Link
          href="/enterprise/subscription"
          className="flex items-center justify-between gap-2 bg-zinc-900 border border-purple-900/30 rounded-2xl px-4 py-3 mb-4 hover:border-purple-500/30 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm text-white/70 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Gérer mon abonnement
          </span>
          <ChevronRight className="w-4 h-4 text-white/30" />
        </Link>
      )}

      <div className="h-4" />
    </div>
  )
}
