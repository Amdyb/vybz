'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, CheckCircle2, XCircle, AlertTriangle,
  Loader2, RefreshCw, Camera, CalendarDays, Ticket,
  Clock, WifiOff,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScanState = 'scanning' | 'loading' | 'valid' | 'used' | 'cancelled' | 'expired' | 'invalid' | 'error'

interface ScannedTicket {
  id: string
  status: string
  scanned_at: string | null
  qr_token: string
  events: { title: string; event_date: string } | null
  ticket_types: { name: string } | null
}

interface LogEntry {
  token: string
  state: ScanState
  eventTitle: string | null
  time: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<ScanState, { icon: React.ElementType; color: string; bg: string; ring: string; label: string }> = {
  scanning: { icon: Camera,        color: 'text-zinc-400',   bg: 'bg-zinc-800',       ring: 'ring-zinc-600',   label: 'En attente' },
  loading:  { icon: Loader2,       color: 'text-purple-400', bg: 'bg-purple-900/30',  ring: 'ring-purple-500', label: 'Vérification…' },
  valid:    { icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-900/30', ring: 'ring-emerald-500',label: 'ACCÈS ACCORDÉ' },
  used:     { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-900/30',     ring: 'ring-red-500',    label: 'DÉJÀ UTILISÉ' },
  cancelled:{ icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-900/30',     ring: 'ring-red-500',    label: 'TICKET ANNULÉ' },
  expired:  { icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-900/30',   ring: 'ring-amber-500',  label: 'TICKET EXPIRÉ' },
  invalid:  { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-900/30',     ring: 'ring-red-500',    label: 'TICKET INVALIDE' },
  error:    { icon: WifiOff,       color: 'text-zinc-400',   bg: 'bg-zinc-800',       ring: 'ring-zinc-600',   label: 'Erreur réseau' },
}

function logStateCls(state: ScanState): string {
  if (state === 'valid')    return 'border-l-emerald-500 bg-emerald-500/5'
  if (state === 'used' || state === 'cancelled' || state === 'expired' || state === 'invalid' || state === 'error')
                            return 'border-l-red-500 bg-red-500/5'
  return 'border-l-zinc-600 bg-zinc-800/30'
}

function vibrate(pattern: number[]) {
  try { navigator.vibrate?.(pattern) } catch {}
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScannerPage() {
  const router        = useRouter()
  const scannerRef    = useRef<unknown>(null)
  const isProcessing  = useRef(false)
  const [userId, setUserId]         = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cameraErr, setCameraErr]   = useState('')
  const [scanState, setScanState]   = useState<ScanState>('scanning')
  const [ticket, setTicket]         = useState<ScannedTicket | null>(null)
  const [log, setLog]               = useState<LogEntry[]>([])

  // ── Auth + role guard ──
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if ((p as { role?: string } | null)?.role !== 'organizer') {
        router.replace('/enterprise/onboarding'); return
      }
      setUserId(user.id)
      setAuthLoading(false)
    })
  }, [router])

  // ── Scan handler ──
  const handleScan = useCallback(async (rawToken: string, uid: string) => {
    if (isProcessing.current) return
    isProcessing.current = true

    setScanState('loading')
    setTicket(null)

    const { data } = await supabase
      .from('tickets')
      .select(`
        id, status, scanned_at, qr_token,
        events!tickets_event_id_fkey(title, event_date),
        ticket_types!tickets_ticket_type_id_fkey(name)
      `)
      .eq('qr_token', rawToken)
      .maybeSingle()

    const t = data as ScannedTicket | null

    function addLog(state: ScanState) {
      setLog(prev => [{
        token:      rawToken.slice(0, 10).toUpperCase(),
        state,
        eventTitle: t?.events?.title ?? null,
        time:       new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }, ...prev].slice(0, 5))
    }

    if (!t) {
      setScanState('invalid')
      addLog('invalid')
      vibrate([80, 40, 80, 40, 80])
      return
    }

    const status = (t.status ?? 'UNUSED').toUpperCase()

    if (status === 'UNUSED') {
      const now = new Date().toISOString()
      type TicketUpdate = { status: string; scanned_at: string; scanned_by: string }
      await supabase.from('tickets').update({ status: 'USED', scanned_at: now, scanned_by: uid } as TicketUpdate as never).eq('id', t.id)
      setTicket({ ...t, status: 'USED', scanned_at: now })
      setScanState('valid')
      addLog('valid')
      vibrate([300])
    } else if (status === 'USED') {
      setTicket(t)
      setScanState('used')
      addLog('used')
      vibrate([80, 40, 80, 40, 80])
    } else if (status === 'CANCELLED') {
      setTicket(t)
      setScanState('cancelled')
      addLog('cancelled')
      vibrate([80, 40, 80, 40, 80])
    } else {
      setTicket(t)
      setScanState('expired')
      addLog('expired')
      vibrate([80, 40, 80, 40, 80])
    }
  }, [])

  // ── Start camera ──
  const startCamera = useCallback(async (uid: string) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        (decodedText: string) => { handleScan(decodedText, uid) },
        () => {} // scan errors (no QR in frame) are expected
      )
    } catch {
      setCameraErr('Impossible d\'accéder à la caméra. Vérifiez que vous avez autorisé l\'accès.')
    }
  }, [handleScan])

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current as { stop?: () => Promise<void> } | null
    if (s?.stop) { try { await s.stop() } catch {} }
    scannerRef.current = null
  }, [])

  // Start scanner once auth resolves
  useEffect(() => {
    if (!authLoading && userId) startCamera(userId)
    return () => { stopCamera() }
  }, [authLoading, userId, startCamera, stopCamera])

  // ── Reset ──
  async function handleReset() {
    isProcessing.current = false
    setTicket(null)
    setScanState('scanning')

    // Resume or restart scanner
    const s = scannerRef.current as { resume?: () => void } | null
    if (s?.resume) {
      try { s.resume() } catch {}
    } else if (userId) {
      await startCamera(userId)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  const cfg = STATE_CONFIG[scanState]
  const StatusIcon = cfg.icon
  const isResult = !['scanning', 'loading'].includes(scanState)

  return (
    <div className="min-h-screen px-4 py-5 max-w-sm mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/enterprise"
          className="w-9 h-9 rounded-full bg-zinc-900 border border-purple-900/30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black text-white leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
            Scanner de tickets
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${scanState === 'scanning' ? 'bg-emerald-400 animate-pulse' : scanState === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-zinc-500 text-xs">
              {scanState === 'scanning' ? 'Prêt à scanner' : scanState === 'loading' ? 'Vérification…' : 'En pause'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Camera / Result area ── */}
      <div className="mb-4">
        {cameraErr ? (
          /* Camera error */
          <div className="w-full aspect-square rounded-3xl bg-zinc-900 border border-red-900/30 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Camera className="w-12 h-12 text-red-400/50" />
            <p className="text-zinc-400 text-sm leading-relaxed">{cameraErr}</p>
            <button
              onClick={() => { setCameraErr(''); if (userId) startCamera(userId) }}
              className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-full hover:border-purple-500/40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réessayer
            </button>
          </div>
        ) : isResult ? (
          /* Scan result card */
          <div className={`w-full rounded-3xl border-2 p-6 text-center ring-4 ring-offset-2 ring-offset-[#08080F] transition-all ${cfg.bg} ${cfg.ring.replace('ring-', 'border-')} ${cfg.ring}`}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${cfg.bg} border-2 ${cfg.ring.replace('ring-', 'border-')}`}>
              <StatusIcon className={`w-10 h-10 ${cfg.color} ${scanState === 'loading' ? 'animate-spin' : ''}`} />
            </div>

            <p className={`text-xl font-black mb-4 ${cfg.color}`}>{cfg.label}</p>

            {/* Ticket details */}
            {ticket && (
              <div className="bg-black/20 rounded-2xl p-4 text-left space-y-2.5 mb-5">
                {ticket.events?.title && (
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase tracking-wider">Événement</p>
                      <p className="text-white text-sm font-semibold leading-tight">{ticket.events.title}</p>
                    </div>
                  </div>
                )}
                {ticket.ticket_types?.name && (
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase tracking-wider">Type de billet</p>
                      <p className="text-white text-sm font-semibold">{ticket.ticket_types.name}</p>
                    </div>
                  </div>
                )}
                {ticket.events?.event_date && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase tracking-wider">Date</p>
                      <p className="text-white text-sm font-semibold">{formatDate(ticket.events.event_date)}</p>
                    </div>
                  </div>
                )}
                {/* Previous scan time for USED tickets */}
                {scanState === 'used' && ticket.scanned_at && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <Clock className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold">Scanné le</p>
                      <p className="text-red-300 text-sm font-semibold">
                        {new Date(ticket.scanned_at).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {/* Token reference */}
                <p className="text-zinc-700 text-[10px] font-mono pt-1">
                  #{ticket.qr_token.slice(0, 16).toUpperCase()}
                </p>
              </div>
            )}

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-purple-500/40 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              Scanner le ticket suivant
            </button>
          </div>
        ) : (
          /* Camera viewfinder */
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black border border-zinc-800">
            {/* Camera output rendered here by html5-qrcode */}
            <div id="qr-reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden" />

            {/* Corner frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner markers */}
              {[
                'top-6 left-6 border-t-2 border-l-2 rounded-tl-lg',
                'top-6 right-6 border-t-2 border-r-2 rounded-tr-lg',
                'bottom-6 left-6 border-b-2 border-l-2 rounded-bl-lg',
                'bottom-6 right-6 border-b-2 border-r-2 rounded-br-lg',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-purple-400 ${cls}`} />
              ))}

              {/* Center target box */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border border-white/10 rounded-xl" />
              </div>

              {/* Loading overlay */}
              {scanState === 'loading' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                  <p className="text-white text-sm font-semibold">Vérification en cours…</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instruction text below viewfinder */}
        {!isResult && !cameraErr && (
          <p className="text-zinc-500 text-xs text-center mt-3">
            Pointez la caméra vers le QR code du billet
          </p>
        )}
      </div>

      {/* ── Scan log ── */}
      {log.length > 0 && (
        <div>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2">
            Derniers scans ({log.length})
          </p>
          <div className="space-y-1.5">
            {log.map((entry, i) => {
              const lCfg = STATE_CONFIG[entry.state]
              const LIcon = lCfg.icon
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-l-2 ${logStateCls(entry.state)}`}
                >
                  <LIcon className={`w-4 h-4 shrink-0 ${lCfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-mono truncate">#{entry.token}</p>
                    {entry.eventTitle && (
                      <p className="text-zinc-500 text-[10px] truncate">{entry.eventTitle}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[10px] font-bold uppercase ${lCfg.color}`}>
                      {lCfg.label}
                    </p>
                    <p className="text-zinc-600 text-[10px]">{entry.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-6" />
    </div>
  )
}
