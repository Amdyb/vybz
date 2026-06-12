'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, TrendingUp, Ticket, Users, CreditCard,
  BarChart2, Download, Loader2, CalendarDays,
  Star, Clock, Zap, ShoppingBag,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type Range = '7j' | '30j' | '3m' | '12m'

interface OrgEvent {
  id: string; title: string; event_date: string; start_time: string
  category: string; capacity: number | null; currency: string | null; status: string | null
}
interface OrgOrder {
  id: string; total_amount: number; currency: string | null; status: string | null
  payment_method: string | null; created_at: string; event_id: string
  user_id: string | null; quantity: number
  ticket_types: { name: string; price: number } | null
}
interface OrgTicket {
  id: string; event_id: string; status: string | null; created_at: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const RANGES: { key: Range; label: string; days: number }[] = [
  { key: '7j',  label: '7 jours',  days: 7   },
  { key: '30j', label: '30 jours', days: 30  },
  { key: '3m',  label: '3 mois',   days: 90  },
  { key: '12m', label: '12 mois',  days: 365 },
]

const CHART_THEME = {
  grid:    '#27272a',
  axis:    '#71717a',
  tooltip: { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' },
  label:   { color: '#a1a1aa', fontSize: 11 },
}

const DAY_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function fmtXOF(n: number): string {
  return n === 0 ? '0 XOF' : `${n.toLocaleString('fr-SN')} XOF`
}

function periodKey(iso: string, range: Range): string {
  const d = new Date(iso)
  if (range === '7j' || range === '30j') return d.toISOString().split('T')[0]
  if (range === '3m') {
    const wk = Math.ceil(d.getDate() / 7)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-S${wk}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shortPeriodLabel(key: string, range: Range): string {
  if (range === '7j' || range === '30j') {
    const [, m, d] = key.split('-')
    return `${d}/${m}`
  }
  if (range === '3m') {
    const parts = key.split('-')
    return `${parts[1]}/${parts[2]}`
  }
  const [y, m] = key.split('-')
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  return months[parseInt(m) - 1] + (y !== new Date().getFullYear().toString() ? ` ${y}` : '')
}

function buildRevenueChart(orders: OrgOrder[], range: Range) {
  const agg: Record<string, number> = {}
  orders.forEach(o => {
    const k = periodKey(o.created_at, range)
    agg[k] = (agg[k] ?? 0) + (o.total_amount ?? 0)
  })
  return Object.entries(agg)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ label: shortPeriodLabel(k, range), revenus: v }))
}

function exportCSV(orders: OrgOrder[], events: OrgEvent[]) {
  const eventMap = Object.fromEntries(events.map(e => [e.id, e]))
  const header = ['Référence', 'Événement', 'Type de billet', 'Montant', 'Devise', 'Paiement', 'Statut', 'Date']
  const rows = orders.map(o => [
    o.id.slice(0, 8).toUpperCase(),
    eventMap[o.event_id]?.title ?? '—',
    o.ticket_types?.name ?? '—',
    o.total_amount ?? 0,
    o.currency ?? 'XOF',
    o.payment_method ?? '—',
    o.status ?? '—',
    new Date(o.created_at).toLocaleDateString('fr-FR'),
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `analytiques-vybz-${new Date().toISOString().split('T')[0]}.csv`,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router   = useRouter()
  const [range, setRange]     = useState<Range>('30j')
  const [authOk, setAuthOk]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [events,  setEvents]  = useState<OrgEvent[]>([])
  const [orders,  setOrders]  = useState<OrgOrder[]>([])
  const [tickets, setTickets] = useState<OrgTicket[]>([])

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if ((p as { role?: string } | null)?.role !== 'organizer') {
        router.replace('/enterprise/onboarding'); return
      }
      setAuthOk(true)
    })
    setMounted(true)
  }, [router])

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: evData } = await supabase
      .from('events')
      .select('id,title,event_date,start_time,category,capacity,currency,status')
      .eq('organizer_id', user.id)
      .order('event_date', { ascending: false })
      .limit(100)

    const orgEvents = (evData ?? []) as OrgEvent[]
    setEvents(orgEvents)

    const ids = orgEvents.map(e => e.id)
    if (!ids.length) { setOrders([]); setTickets([]); setLoading(false); return }

    const since = startDate(RANGES.find(x => x.key === r)!.days)

    const [ordRes, tickRes] = await Promise.all([
      supabase.from('orders')
        .select('id,total_amount,currency,status,payment_method,created_at,event_id,user_id,quantity,ticket_types!orders_ticket_type_id_fkey(name,price)')
        .in('event_id', ids)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('tickets')
        .select('id,event_id,status,created_at')
        .in('event_id', ids)
        .gte('created_at', since)
        .limit(2000),
    ])

    setOrders((ordRes.data ?? []) as unknown as OrgOrder[])
    setTickets((tickRes.data ?? []) as unknown as OrgTicket[])
    setLoading(false)
  }, [])

  useEffect(() => { if (authOk) fetchData(range) }, [authOk, range, fetchData])

  // ── Computed ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const revenue  = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
    const sold     = tickets.length
    const attended = tickets.filter(t => t.status === 'USED').length
    const avgPrice = sold > 0 ? Math.round(revenue / sold) : 0
    return { revenue, sold, attended, avgPrice }
  }, [orders, tickets])

  const revenueChart = useMemo(() => buildRevenueChart(orders, range), [orders, range])

  const ticketsChart = useMemo(() => {
    const map: Record<string, number> = {}
    tickets.forEach(t => { if (t.event_id) map[t.event_id] = (map[t.event_id] ?? 0) + 1 })
    return events
      .map(e => ({ name: e.title.length > 14 ? e.title.slice(0, 14) + '…' : e.title, billets: map[e.id] ?? 0 }))
      .filter(x => x.billets > 0)
      .sort((a, b) => b.billets - a.billets)
      .slice(0, 8)
  }, [events, tickets])

  const topEvents = useMemo(() => {
    const tickMap: Record<string, number> = {}
    const revMap:  Record<string, number> = {}
    tickets.forEach(t => { tickMap[t.event_id] = (tickMap[t.event_id] ?? 0) + 1 })
    orders.forEach(o => { revMap[o.event_id]  = (revMap[o.event_id]  ?? 0) + (o.total_amount ?? 0) })
    return events
      .map(e => ({
        ...e,
        sold: tickMap[e.id] ?? 0,
        revenue: revMap[e.id] ?? 0,
        rate: e.capacity ? Math.min(100, Math.round(((tickMap[e.id] ?? 0) / e.capacity) * 100)) : null,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.sold - a.sold)
      .slice(0, 5)
  }, [events, tickets, orders])

  const insights = useMemo(() => {
    // Most popular category
    const catMap: Record<string, number> = {}
    events.forEach(e => { catMap[e.category] = (catMap[e.category] ?? 0) + (tickets.filter(t => t.event_id === e.id).length) })
    const topCat = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—'

    // Peak day of week (from order timestamps)
    const dayMap: Record<number, number> = {}
    orders.forEach(o => { const d = new Date(o.created_at).getDay(); dayMap[d] = (dayMap[d] ?? 0) + 1 })
    const peakDay = Object.entries(dayMap).sort(([, a], [, b]) => b - a)[0]
    const peakDayLabel = peakDay ? DAY_FR[Number(peakDay[0])] : '—'

    // Peak hour from event start_time
    const hrMap: Record<number, number> = {}
    events.forEach(e => {
      if (e.start_time) {
        const h = parseInt(e.start_time.split(':')[0])
        hrMap[h] = (hrMap[h] ?? 0) + 1
      }
    })
    const peakHr = Object.entries(hrMap).sort(([, a], [, b]) => b - a)[0]
    const peakHrLabel = peakHr ? `${peakHr[0]}h00` : '—'

    const avgSpend = stats.sold > 0 ? Math.round(stats.revenue / stats.sold) : 0

    return { topCat, peakDayLabel, peakHrLabel, avgSpend }
  }, [events, tickets, orders, stats])

  const recentTxns = useMemo(() => {
    const evMap = Object.fromEntries(events.map(e => [e.id, e]))
    return orders.slice(0, 20).map(o => ({ ...o, event: evMap[o.event_id] ?? null }))
  }, [orders, events])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!authOk) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
  }

  const hasData = events.length > 0

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/enterprise" className="w-9 h-9 rounded-full bg-zinc-900 border border-purple-900/30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Analytiques</h1>
        </div>
        <button
          onClick={() => exportCSV(orders, events)}
          disabled={orders.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-purple-900/30 text-zinc-400 hover:text-white hover:border-purple-500/40 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Exporter CSV
        </button>
      </div>

      {/* ── Date range tabs ── */}
      <div className="flex gap-1 p-1 bg-zinc-900 border border-purple-900/30 rounded-2xl mb-6">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              range === r.key
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="w-12 h-12 text-purple-400/20 mb-3" />
          <p className="text-zinc-500 text-sm font-medium">Aucun événement créé</p>
          <p className="text-zinc-600 text-xs mt-1 mb-5">Créez votre premier événement pour voir les analytiques.</p>
          <Link href="/enterprise/create-event" className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold px-5 py-2.5 rounded-full">
            Créer un événement
          </Link>
        </div>
      ) : (
        <>
          {/* ── Stats cards ── */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Revenus totaux',      value: fmtXOF(stats.revenue),        icon: TrendingUp, color: 'text-emerald-400', small: true },
              { label: 'Billets vendus',       value: stats.sold,                   icon: Ticket,     color: 'text-purple-400' },
              { label: 'Participants',          value: stats.attended,               icon: Users,      color: 'text-cyan-400' },
              { label: 'Prix moyen',           value: fmtXOF(stats.avgPrice),       icon: CreditCard, color: 'text-amber-400', small: true },
            ].map(({ label, value, icon: Icon, color, small }) => (
              <div key={label} className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-4">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <div className={`font-black text-white mb-0.5 ${small ? 'text-sm leading-tight' : 'text-2xl'}`}>{value}</div>
                <div className="text-zinc-500 text-[11px]">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Revenue chart ── */}
          <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
              Revenus dans le temps
            </h2>
            {revenueChart.length < 2 ? (
              <div className="h-40 flex items-center justify-center text-zinc-600 text-xs">Pas assez de données pour cette période</div>
            ) : mounted ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={revenueChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: CHART_THEME.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: CHART_THEME.axis, fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} width={36} />
                  <Tooltip
                    contentStyle={CHART_THEME.tooltip}
                    labelStyle={CHART_THEME.label}
                    formatter={(v: unknown) => [fmtXOF(Number(v ?? 0)), 'Revenus']}
                    cursor={{ stroke: '#a855f7', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line type="monotone" dataKey="revenus" stroke="#a855f7" strokeWidth={2}
                    dot={false} activeDot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          {/* ── Tickets by event chart ── */}
          {ticketsChart.length > 0 && (
            <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
              <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
                Billets vendus par événement
              </h2>
              {mounted && (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ticketsChart} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} horizontal vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: CHART_THEME.axis, fontSize: 9 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: CHART_THEME.axis, fontSize: 10 }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                    <Tooltip
                      contentStyle={CHART_THEME.tooltip}
                      labelStyle={CHART_THEME.label}
                      formatter={(v: unknown) => [Number(v ?? 0), 'Billets']}
                      cursor={{ fill: 'rgba(168,85,247,0.05)' }}
                    />
                    <Bar dataKey="billets" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* ── Top events ── */}
          {topEvents.some(e => e.sold > 0) && (
            <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
              <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
                Événements les plus performants
              </h2>
              <div className="space-y-3">
                {topEvents.filter(e => e.sold > 0).map((ev, i) => (
                  <div key={ev.id} className="flex items-start gap-3">
                    <span className="text-zinc-600 font-bold text-sm w-5 shrink-0 pt-0.5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold leading-tight line-clamp-1">{ev.title}</p>
                      <p className="text-zinc-500 text-[10px] mt-0.5">{ev.category} · {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                      {ev.rate !== null && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${ev.rate >= 90 ? 'bg-red-400' : ev.rate >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${ev.rate}%` }} />
                          </div>
                          <span className="text-zinc-500 text-[10px] shrink-0">{ev.rate}%</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-400 text-xs font-bold">{fmtXOF(ev.revenue)}</p>
                      <p className="text-zinc-500 text-[10px]">{ev.sold} billets</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Audience insights ── */}
          <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
              Analyse de l&apos;audience
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Catégorie populaire', value: insights.topCat,       icon: Star,        color: 'text-amber-400' },
                { label: 'Jour de pointe',      value: insights.peakDayLabel, icon: CalendarDays, color: 'text-purple-400' },
                { label: 'Heure de pointe',     value: insights.peakHrLabel,  icon: Clock,       color: 'text-cyan-400' },
                { label: 'Dépense moyenne',     value: fmtXOF(insights.avgSpend), icon: Zap,     color: 'text-emerald-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-zinc-800/40 rounded-xl p-3">
                  <Icon className={`w-4 h-4 ${color} mb-1.5`} />
                  <p className="text-white text-xs font-semibold leading-tight">{value}</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent transactions ── */}
          <div className="bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 mb-4">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">
              Transactions récentes
            </h2>
            {recentTxns.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ShoppingBag className="w-10 h-10 text-purple-400/20 mb-2" />
                <p className="text-zinc-500 text-xs">Aucune transaction sur cette période</p>
              </div>
            ) : (
              <>
                {/* Mobile: stacked cards */}
                <div className="space-y-2.5 sm:hidden">
                  {recentTxns.map(tx => {
                    const statusCls =
                      tx.status === 'paid'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      tx.status === 'pending' ? 'bg-amber-500/10  text-amber-400  border-amber-500/30'  :
                                                'bg-zinc-700/40   text-zinc-400   border-zinc-700'
                    const statusLabel = tx.status === 'paid' ? 'Payé' : tx.status === 'pending' ? 'En attente' : tx.status ?? '—'
                    return (
                      <div key={tx.id} className="bg-zinc-800/40 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-white text-xs font-semibold leading-tight line-clamp-1 flex-1 min-w-0">
                            {tx.event?.title ?? '—'}
                          </p>
                          <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusCls}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-zinc-500 text-[11px] truncate">
                            {tx.ticket_types?.name ?? '—'} · {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-emerald-400 text-xs font-bold whitespace-nowrap shrink-0">
                            {(tx.total_amount ?? 0).toLocaleString('fr-SN')} {tx.currency ?? 'XOF'}
                          </span>
                        </div>
                        <p className="text-zinc-700 text-[9px] font-mono mt-1.5">#{tx.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Tablet/desktop: table */}
                <div className="hidden sm:block overflow-x-auto -mx-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-zinc-600 uppercase tracking-wider text-[10px]">
                        {['Réf.', 'Événement', 'Type', 'Montant', 'Date', 'Statut'].map(h => (
                          <th key={h} className="text-left px-5 pb-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentTxns.map(tx => (
                        <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-5 py-2.5 font-mono text-zinc-500 text-[10px]">
                            #{tx.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-5 py-2.5 text-white font-medium max-w-[120px]">
                            <span className="line-clamp-1">{tx.event?.title ?? '—'}</span>
                          </td>
                          <td className="px-5 py-2.5 text-zinc-400">{tx.ticket_types?.name ?? '—'}</td>
                          <td className="px-5 py-2.5 text-emerald-400 font-bold whitespace-nowrap">
                            {(tx.total_amount ?? 0).toLocaleString('fr-SN')} {tx.currency ?? 'XOF'}
                          </td>
                          <td className="px-5 py-2.5 text-zinc-500 whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-5 py-2.5">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              tx.status === 'paid'    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              tx.status === 'pending' ? 'bg-amber-500/10  text-amber-400  border-amber-500/30'  :
                                                        'bg-zinc-700/40   text-zinc-400   border-zinc-700'
                            }`}>
                              {tx.status === 'paid' ? 'Payé' : tx.status === 'pending' ? 'En attente' : tx.status ?? '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}
