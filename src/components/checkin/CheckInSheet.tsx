'use client'

import { useState, useEffect } from 'react'
import { X, Globe, Users, Lock, Check, Zap, MapPin, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Visibility = 'public' | 'followers' | 'private'
type Step = 'select' | 'visibility' | 'success'

interface Props {
  venueId?: string
  venueName?: string
  preselectedEventId?: string
  preselectedEventTitle?: string
  onClose: () => void
  onSuccess?: () => void
}

type VenueEvent = { id: string; title: string; event_date: string }

const VISIBILITY_OPTS: {
  value: Visibility
  label: string
  sub: string
  Icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: 'public',    label: 'Public',         sub: 'Visible par tout le monde',  Icon: Globe },
  { value: 'followers', label: 'Amis seulement',  sub: 'Visible par vos abonnés',    Icon: Users },
  { value: 'private',   label: 'Privé',           sub: 'Visible uniquement par vous', Icon: Lock  },
]

export default function CheckInSheet({
  venueId, venueName, preselectedEventId, preselectedEventTitle, onClose, onSuccess,
}: Props) {
  const hasPreset = Boolean(preselectedEventId)
  const [step, setStep]               = useState<Step>(hasPreset ? 'visibility' : 'select')
  const [selEventId, setSelEventId]   = useState<string | null>(preselectedEventId ?? null)
  const [selEventTitle, setSelTitle]  = useState<string | null>(preselectedEventTitle ?? null)
  const [visibility, setVisibility]   = useState<Visibility>('public')
  const [venueEvents, setVenueEvents] = useState<VenueEvent[]>([])
  const [loading, setLoading]         = useState(false)
  const [userId, setUserId]           = useState<string | null>(null)
  const [successVisible, setSuccess]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })

    if (!hasPreset && venueId) {
      const today    = new Date().toISOString().split('T')[0]
      const dayAfter = new Date(Date.now() + 2 * 864e5).toISOString().split('T')[0]
      supabase
        .from('events')
        .select('id, title, event_date')
        .eq('venue_id', venueId)
        .eq('status', 'published')
        .gte('event_date', today)
        .lte('event_date', dayAfter)
        .order('event_date', { ascending: true })
        .limit(5)
        .then(({ data }) => setVenueEvents((data ?? []) as VenueEvent[]))
    }
  }, [venueId, hasPreset])

  useEffect(() => {
    if (step === 'success') {
      requestAnimationFrame(() => setSuccess(true))
    }
  }, [step])

  const confirm = async () => {
    if (!userId) { window.location.href = '/sign-in'; return }
    setLoading(true)
    await supabase.from('checkins').insert({
      user_id:    userId,
      venue_id:   venueId ?? null,
      event_id:   selEventId ?? null,
      visibility,
    } as never)
    setLoading(false)
    onSuccess?.()
    setStep('success')
    setTimeout(onClose, 2800)
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-zinc-950 border-t border-purple-900/30 rounded-t-3xl max-h-[88vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0.5">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <h2 className="text-white font-black text-base">Se checker</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* ── Step 1: Select event ────────────────────────────────────── */}
        {step === 'select' && (
          <div className="px-5 py-5">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">
              À quel événement es-tu ?
            </p>

            {/* Venue-only option */}
            <OptionRow
              selected={selEventId === null}
              onSelect={() => { setSelEventId(null); setSelTitle(null) }}
              title={venueName ?? 'Ce lieu'}
              sub="Juste au lieu"
              Icon={MapPin}
            />

            {venueEvents.map((ev) => (
              <OptionRow
                key={ev.id}
                selected={selEventId === ev.id}
                onSelect={() => { setSelEventId(ev.id); setSelTitle(ev.title) }}
                title={ev.title}
                sub={new Date(ev.event_date + 'T00:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'short',
                })}
              />
            ))}

            <button
              onClick={() => setStep('visibility')}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Continuer
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2: Select visibility ───────────────────────────────── */}
        {step === 'visibility' && (
          <div className="px-5 py-5">
            {(selEventTitle || venueName) && (
              <p className="text-fuchsia-400 text-xs font-semibold mb-4 truncate">
                {selEventTitle ?? venueName}
              </p>
            )}

            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4">
              Qui peut voir ça ?
            </p>

            <div className="space-y-2 mb-5">
              {VISIBILITY_OPTS.map(({ value, label, sub, Icon }) => (
                <button
                  key={value}
                  onClick={() => setVisibility(value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    visibility === value
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${visibility === value ? 'text-fuchsia-400' : 'text-white/35'}`} />
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${visibility === value ? 'text-white' : 'text-white/70'}`}>{label}</p>
                    <p className="text-white/30 text-xs">{sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    visibility === value ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-white/20'
                  }`}>
                    {visibility === value && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            {!hasPreset && (
              <button
                onClick={() => setStep('select')}
                className="text-white/35 text-xs mb-4 hover:text-white/60 transition-colors"
              >
                ← Modifier l&apos;événement
              </button>
            )}

            <button
              onClick={confirm}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-sm font-bold rounded-2xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmer le check-in
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Step 3: Success ─────────────────────────────────────────── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center mb-5"
              style={{
                animation: successVisible
                  ? 'checkin-pop 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both'
                  : 'none',
                opacity: successVisible ? 1 : 0,
              }}
            >
              <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>

            <h3 className="text-white font-black text-xl mb-1">Check-in réussi !</h3>
            <p className="text-white/45 text-sm mb-6 truncate max-w-xs">
              {selEventTitle ?? venueName ?? 'Ce lieu'}
            </p>

            <div
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3"
              style={{
                animation: successVisible
                  ? 'checkin-pop 0.45s 0.18s cubic-bezier(0.175,0.885,0.32,1.275) both'
                  : 'none',
                opacity: successVisible ? 1 : 0,
              }}
            >
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-black text-lg">+20</span>
              <span className="text-amber-400/70 text-sm font-semibold">Pulse Points</span>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  )
}

// ─── Shared option row ────────────────────────────────────────────────────────

function OptionRow({
  selected, onSelect, title, sub, Icon,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  sub: string
  Icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl mb-2 border transition-all ${
        selected
          ? 'border-fuchsia-500/50 bg-fuchsia-500/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'border-fuchsia-500 bg-fuchsia-500' : 'border-white/30'
      }`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-semibold line-clamp-1 ${selected ? 'text-white' : 'text-white/80'}`}>{title}</p>
        <p className="text-white/35 text-xs flex items-center gap-1 mt-0.5">
          {Icon && <Icon className="w-3 h-3 shrink-0" />}
          {sub}
        </p>
      </div>
    </button>
  )
}
