'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, CheckCircle2, XCircle, AlertTriangle,
  Loader2, RefreshCw, Camera, CalendarDays, Ticket,
  Clock, WifiOff, Gift, User, ShieldAlert,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'tickets' | 'rewards'
type ScanState = 'scanning' | 'loading' | 'valid' | 'used' | 'cancelled' | 'expired' | 'invalid' | 'error'
type RewardState = 'idle' | 'loading' | 'preview' | 'redeemed' | 'already' | 'invalid' | 'not_authorized' | 'error'

interface ScannedTicket {
  id: string
  status: string
  scanned_at: string | null
  qr_token: string
  events: { title: string; event_date: string } | null
  ticket_types: { name: string } | null
}

interface RewardLookup {
  status: string
  reward_title?: string
  reward_description?: string
  user_name?: string
  claimed_at?: string
  redeemed_at?: string
}

interface LogEntry { token: string; state: ScanState; eventTitle: string | null; time: string }

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

function vibrate(pattern: number[]) { try { navigator.vibrate?.(pattern) } catch {} }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScannerPage() {
  const router        = useRouter()
  const scannerRef    = useRef<unknown>(null)
  const isProcessing  = useRef(false)
  const modeRef       = useRef<Mode>('tickets')

  const [userId, setUserId]           = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cameraErr, setCameraErr]     = useState('')
  const [mode, setMode]               = useState<Mode>('tickets')

  // Ticket scan state
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [ticket, setTicket]       = useState<ScannedTicket | null>(null)
  const [log, setLog]             = useState<LogEntry[]>([])

  // Reward scan state
  const [rewardState, setRewardState] = useState<RewardState>('idle')
  const [rewardClaim, setRewardClaim] = useState<RewardLookup | null>(null)
  const [scannedToken, setScannedToken] = useState('')
  const [confirming, setConfirming]   = useState(false)

  useEffect(() => { modeRef.current = mode }, [mode])

  // ── Auth + role guard ──
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if ((p as { role?: string } | null)?.role !== 'organizer') { router.replace('/enterprise/onboarding'); return }
      setUserId(user.id)
      setAuthLoading(false)
    })
  }, [router])

  // ── Ticket scan ──
  const handleTicketScan = useCallback(async (rawToken: string, uid: string) => {
    setScanState('loading')
    setTicket(null)

    const { data } = await supabase
      .from('tickets')
      .select(`id, status, scanned_at, qr_token,
        events!tickets_event_id_fkey(title, event_date),
        ticket_types!tickets_ticket_type_id_fkey(name)`)
      .eq('qr_token', rawToken)
      .maybeSingle()

    const t = data as ScannedTicket | null
    const addLog = (state: ScanState) => setLog(prev => [{
      token: rawToken.slice(0, 10).toUpperCase(), state,
      eventTitle: t?.events?.title ?? null,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }, ...prev].slice(0, 5))

    if (!t) { setScanState('invalid'); addLog('invalid'); vibrate([80, 40, 80, 40, 80]); return }
    const status = (t.status ?? 'UNUSED').toUpperCase()
    if (status === 'UNUSED') {
      const now = new Date().toISOString()
      await supabase.from('tickets').update({ status: 'USED', scanned_at: now, scanned_by: uid } as never).eq('id', t.id)
      setTicket({ ...t, status: 'USED', scanned_at: now }); setScanState('valid'); addLog('valid'); vibrate([300])
    } else if (status === 'CANCELLED') { setTicket(t); setScanState('cancelled'); addLog('cancelled'); vibrate([80, 40, 80, 40, 80]) }
    else if (status === 'USED') { setTicket(t); setScanState('used'); addLog('used'); vibrate([80, 40, 80, 40, 80]) }
    else { setTicket(t); setScanState('expired'); addLog('expired'); vibrate([80, 40, 80, 40, 80]) }
  }, [])

  // ── Reward scan (lookup → preview) ──
  const handleRewardScan = useCallback(async (rawToken: string) => {
    setRewardState('loading'); setRewardClaim(null); setScannedToken(rawToken)
    const { data, error } = await supabase.rpc('lookup_reward_claim', { p_qr_token: rawToken } as never)
    const r = (error ? null : data) as RewardLookup | null
    if (!r) { setRewardState('error'); vibrate([80, 40, 80]); return }
    if (r.status === 'not_found')        { setRewardState('invalid'); vibrate([80, 40, 80, 40, 80]) }
    else if (r.status === 'not_authorized') { setRewardState('not_authorized'); vibrate([80, 40, 80, 40, 80]) }
    else if (r.status === 'redeemed')    { setRewardClaim(r); setRewardState('already'); vibrate([80, 40, 80, 40, 80]) }
    else if (r.status === 'claimed')     { setRewardClaim(r); setRewardState('preview'); vibrate([120]) }
    else                                 { setRewardState('error') }
  }, [])

  async function confirmRedeem() {
    setConfirming(true)
    const { data, error } = await supabase.rpc('redeem_reward', { p_qr_token: scannedToken } as never)
    const r = (error ? null : data) as { status: string; redeemed_at?: string } | null
    if (r?.status === 'ok') { setRewardState('redeemed'); vibrate([300]) }
    else if (r?.status === 'already_redeemed') { setRewardClaim((c) => c ? { ...c, redeemed_at: r.redeemed_at } : c); setRewardState('already') }
    else setRewardState('error')
    setConfirming(false)
  }

  // ── Camera ──
  const onDecode = useCallback((text: string, uid: string) => {
    if (isProcessing.current) return
    isProcessing.current = true
    if (modeRef.current === 'rewards') handleRewardScan(text)
    else handleTicketScan(text, uid)
  }, [handleRewardScan, handleTicketScan])

  const startCamera = useCallback(async (uid: string) => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        (decodedText: string) => onDecode(decodedText, uid),
        () => {}
      )
    } catch {
      setCameraErr('Impossible d\'accéder à la caméra. Vérifiez que vous avez autorisé l\'accès.')
    }
  }, [onDecode])

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current as { stop?: () => Promise<void> } | null
    if (s?.stop) { try { await s.stop() } catch {} }
    scannerRef.current = null
  }, [])

  useEffect(() => {
    if (!authLoading && userId) startCamera(userId)
    return () => { stopCamera() }
  }, [authLoading, userId, startCamera, stopCamera])

  // ── Reset / mode switch ──
  async function resume() {
    isProcessing.current = false
    const s = scannerRef.current as { resume?: () => void } | null
    if (s?.resume) { try { s.resume() } catch {} } else if (userId) { await startCamera(userId) }
  }
  function handleReset() {
    setTicket(null); setScanState('scanning')
    setRewardClaim(null); setRewardState('idle')
    resume()
  }
  function switchMode(m: Mode) {
    if (m === mode) return
    setMode(m)
    setTicket(null); setScanState('scanning')
    setRewardClaim(null); setRewardState('idle')
    resume()
  }

  if (authLoading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
  }

  const cfg = STATE_CONFIG[scanState]
  const StatusIcon = cfg.icon
  const ticketResult = mode === 'tickets' && !['scanning', 'loading'].includes(scanState)
  const rewardResult = mode === 'rewards' && !['idle', 'loading'].includes(rewardState)
  const isResult  = ticketResult || rewardResult
  const isLoading = (mode === 'tickets' && scanState === 'loading') || (mode === 'rewards' && rewardState === 'loading')

  return (
    <div className="min-h-screen px-4 py-5 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/enterprise" className="w-9 h-9 rounded-full bg-zinc-900 border border-purple-900/30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-black text-white leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
          {mode === 'tickets' ? 'Scanner de tickets' : 'Scanner de récompenses'}
        </h1>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={() => switchMode('tickets')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${
            mode === 'tickets' ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white' : 'bg-zinc-900 border border-purple-900/30 text-white/50'
          }`}>
          <Ticket className="w-4 h-4" /> Billets
        </button>
        <button onClick={() => switchMode('rewards')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${
            mode === 'rewards' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black' : 'bg-zinc-900 border border-amber-900/30 text-white/50'
          }`}>
          <Gift className="w-4 h-4" /> Récompenses
        </button>
      </div>

      <div className="mb-4">
        {cameraErr ? (
          <div className="w-full aspect-square rounded-3xl bg-zinc-900 border border-red-900/30 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Camera className="w-12 h-12 text-red-400/50" />
            <p className="text-zinc-400 text-sm leading-relaxed">{cameraErr}</p>
            <button onClick={() => { setCameraErr(''); if (userId) startCamera(userId) }}
              className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-full hover:border-purple-500/40 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Réessayer
            </button>
          </div>
        ) : ticketResult ? (
          /* Ticket result */
          <div className={`w-full rounded-3xl border-2 p-6 text-center ring-4 ring-offset-2 ring-offset-[#08080F] transition-all ${cfg.bg} ${cfg.ring.replace('ring-', 'border-')} ${cfg.ring}`}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${cfg.bg} border-2 ${cfg.ring.replace('ring-', 'border-')}`}>
              <StatusIcon className={`w-10 h-10 ${cfg.color}`} />
            </div>
            <p className={`text-xl font-black mb-4 ${cfg.color}`}>{cfg.label}</p>
            {ticket && (
              <div className="bg-black/20 rounded-2xl p-4 text-left space-y-2.5 mb-5">
                {ticket.events?.title && (
                  <Detail icon={CalendarDays} label="Événement" value={ticket.events.title} />
                )}
                {ticket.ticket_types?.name && <Detail icon={Ticket} label="Type de billet" value={ticket.ticket_types.name} />}
                {ticket.events?.event_date && <Detail icon={CalendarDays} label="Date" value={formatDate(ticket.events.event_date)} />}
                {scanState === 'used' && ticket.scanned_at && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <Clock className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold">Scanné le</p>
                      <p className="text-red-300 text-sm font-semibold">{new Date(ticket.scanned_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )}
                <p className="text-zinc-700 text-[10px] font-mono pt-1">#{ticket.qr_token.slice(0, 16).toUpperCase()}</p>
              </div>
            )}
            <ResetButton onClick={handleReset} label="Scanner le ticket suivant" />
          </div>
        ) : rewardResult ? (
          /* Reward result */
          <RewardResult
            state={rewardState} claim={rewardClaim} confirming={confirming}
            onConfirm={confirmRedeem} onReset={handleReset}
          />
        ) : (
          /* Camera viewfinder */
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black border border-zinc-800">
            <div id="qr-reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden" />
            <div className="absolute inset-0 pointer-events-none">
              {['top-6 left-6 border-t-2 border-l-2 rounded-tl-lg','top-6 right-6 border-t-2 border-r-2 rounded-tr-lg','bottom-6 left-6 border-b-2 border-l-2 rounded-bl-lg','bottom-6 right-6 border-b-2 border-r-2 rounded-br-lg'].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 ${mode === 'rewards' ? 'border-amber-400' : 'border-purple-400'} ${cls}`} />
              ))}
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-48 h-48 border border-white/10 rounded-xl" /></div>
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                  <Loader2 className={`w-10 h-10 animate-spin ${mode === 'rewards' ? 'text-amber-400' : 'text-purple-400'}`} />
                  <p className="text-white text-sm font-semibold">Vérification en cours…</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isResult && !cameraErr && (
          <p className="text-zinc-500 text-xs text-center mt-3">
            Pointez la caméra vers le QR {mode === 'rewards' ? 'de la récompense' : 'du billet'}
          </p>
        )}
      </div>

      {/* Ticket scan log (tickets mode only) */}
      {mode === 'tickets' && log.length > 0 && (
        <div>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2">Derniers scans ({log.length})</p>
          <div className="space-y-1.5">
            {log.map((entry, i) => {
              const lCfg = STATE_CONFIG[entry.state]; const LIcon = lCfg.icon
              return (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-l-2 ${logStateCls(entry.state)}`}>
                  <LIcon className={`w-4 h-4 shrink-0 ${lCfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-mono truncate">#{entry.token}</p>
                    {entry.eventTitle && <p className="text-zinc-500 text-[10px] truncate">{entry.eventTitle}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[10px] font-bold uppercase ${lCfg.color}`}>{lCfg.label}</p>
                    <p className="text-zinc-600 text-[10px]">{entry.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="h-6" />
    </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-white text-sm font-semibold leading-tight">{value}</p>
      </div>
    </div>
  )
}

function ResetButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-700 hover:border-purple-500/40 text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-[0.98]">
      <RefreshCw className="w-4 h-4" /> {label}
    </button>
  )
}

function RewardResult({
  state, claim, confirming, onConfirm, onReset,
}: { state: RewardState; claim: RewardLookup | null; confirming: boolean; onConfirm: () => void; onReset: () => void }) {
  const meta: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
    preview:        { icon: Gift,        color: 'text-amber-400',   bg: 'bg-amber-900/20',   border: 'border-amber-500/40',  label: 'RÉCOMPENSE VALIDE' },
    redeemed:       { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-500/50', label: 'REMISE CONFIRMÉE' },
    already:        { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-900/30',     border: 'border-red-500/50',    label: 'DÉJÀ UTILISÉE' },
    invalid:        { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-900/30',     border: 'border-red-500/50',    label: 'QR INVALIDE' },
    not_authorized: { icon: ShieldAlert, color: 'text-amber-400',   bg: 'bg-amber-900/30',   border: 'border-amber-500/50',  label: 'PAS VOTRE RÉCOMPENSE' },
    error:          { icon: WifiOff,     color: 'text-zinc-400',    bg: 'bg-zinc-800',       border: 'border-zinc-600',      label: 'Erreur' },
  }
  const m = meta[state] ?? meta.error
  const Icon = m.icon
  return (
    <div className={`w-full rounded-3xl border-2 p-6 text-center ${m.bg} ${m.border}`}>
      <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${m.bg} border-2 ${m.border}`}>
        <Icon className={`w-10 h-10 ${m.color}`} />
      </div>
      <p className={`text-xl font-black mb-4 ${m.color}`}>{m.label}</p>

      {claim && (state === 'preview' || state === 'redeemed' || state === 'already') && (
        <div className="bg-black/20 rounded-2xl p-4 text-left space-y-2.5 mb-5">
          {claim.reward_title && <Detail icon={Gift} label="Récompense" value={claim.reward_title} />}
          {claim.user_name && <Detail icon={User} label="Membre" value={claim.user_name} />}
          {claim.reward_description && <p className="text-white/50 text-xs">{claim.reward_description}</p>}
          {state === 'already' && claim.redeemed_at && (
            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <Clock className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <p className="text-red-400 text-[10px] uppercase tracking-wider font-semibold">Utilisée le</p>
                <p className="text-red-300 text-sm font-semibold">{new Date(claim.redeemed_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {state === 'preview' ? (
        <div className="space-y-2.5">
          <button onClick={onConfirm} disabled={confirming}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-all disabled:opacity-60">
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {confirming ? 'Confirmation…' : 'Confirmer la remise'}
          </button>
          <button onClick={onReset} className="w-full text-white/50 text-sm font-semibold py-2 hover:text-white transition-colors">Annuler</button>
        </div>
      ) : (
        <ResetButton onClick={onReset} label="Scanner la récompense suivante" />
      )}
    </div>
  )
}
