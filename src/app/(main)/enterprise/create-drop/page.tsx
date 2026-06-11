'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Loader2, CheckCircle2, Zap, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type OrgEvent = { id: string; title: string; venue_id: string | null; price_min: number | null; currency: string | null }

const TIERS: { value: 'all' | 'gold' | 'diamond'; label: string }[] = [
  { value: 'all',     label: 'Tous' },
  { value: 'gold',    label: 'Gold et +' },
  { value: 'diamond', label: 'Diamond' },
]

const DURATIONS = [
  { value: 6,  label: '6 heures' },
  { value: 12, label: '12 heures' },
  { value: 24, label: '24 heures' },
  { value: 48, label: '48 heures' },
]

export default function CreateDropPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents]   = useState<OrgEvent[]>([])
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const [eventId, setEventId]     = useState('')
  const [original, setOriginal]   = useState('')
  const [drop, setDrop]           = useState('')
  const [quantity, setQuantity]   = useState('20')
  const [hours, setHours]         = useState(6)
  const [tier, setTier]           = useState<'all' | 'gold' | 'diamond'>('all')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      const { data } = await supabase
        .from('events')
        .select('id, title, venue_id, price_min, currency')
        .eq('organizer_id', user.id)
        .order('event_date', { ascending: true })
      const list = (data ?? []) as OrgEvent[]
      setEvents(list)
      if (list[0]) {
        setEventId(list[0].id)
        if (list[0].price_min) setOriginal(String(list[0].price_min))
      }
      setLoading(false)
    })
  }, [router])

  const selected = events.find((e) => e.id === eventId)
  const origNum = parseFloat(original) || 0
  const dropNum = drop === '' ? NaN : parseFloat(drop)
  const discount = origNum > 0 && !isNaN(dropNum) ? Math.max(0, Math.round((1 - dropNum / origNum) * 100)) : 0

  async function submit() {
    setError('')
    if (!eventId) { setError('Choisis un événement.'); return }
    if (isNaN(dropNum) || dropNum < 0) { setError('Indique un prix Drop valide.'); return }
    if (origNum > 0 && dropNum > origNum) { setError('Le prix Drop doit être inférieur au prix original.'); return }
    const qty = parseInt(quantity, 10)
    if (!qty || qty < 1) { setError('Indique une quantité valide.'); return }

    setSaving(true)
    const { error: insErr } = await supabase.from('drops').insert({
      event_id: eventId,
      venue_id: selected?.venue_id ?? null,
      original_price: origNum || null,
      drop_price: dropNum,
      discount_percent: discount,
      currency: selected?.currency ?? 'XOF',
      quantity_available: qty,
      quantity_claimed: 0,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
      min_tier_required: tier,
      is_active: true,
    } as never)

    if (insErr) {
      setError(insErr.code === '42501' || /policy/i.test(insErr.message)
        ? "Tu ne peux créer un Drop que pour tes propres événements."
        : 'Une erreur est survenue. Réessaie.')
      setSaving(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/drops'), 1200)
  }

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
  }

  if (done) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Drop publié !</h1>
        <p className="text-white/50 text-sm">Les membres Gold et Diamond ont été notifiés.</p>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-lg mx-auto">
      <Link href="/enterprise" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-center gap-2.5 mb-6">
        <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/25 to-yellow-400/20 border border-amber-500/40 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
        </span>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Créer un Drop</h1>
      </div>

      {events.length === 0 ? (
        <div className="bg-zinc-900 border border-amber-900/30 rounded-2xl p-8 text-center">
          <p className="text-white/50 text-sm mb-4">Tu n&apos;as pas encore d&apos;événement. Crée un événement avant de lancer un Drop.</p>
          <Link href="/enterprise/create-event" className="text-amber-400 text-sm font-semibold">Créer un événement</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <Field label="Événement">
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="drop-input">
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix original (XOF)">
              <input type="number" inputMode="numeric" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="5000" className="drop-input" />
            </Field>
            <Field label="Prix Drop (XOF)">
              <input type="number" inputMode="numeric" value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="2500" className="drop-input" />
            </Field>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-center gap-2 -mt-2">
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-sm px-3 py-1 rounded-full">-{discount}%</span>
              <span className="text-white/40 text-xs">de réduction</span>
            </div>
          )}

          <Field label="Quantité disponible">
            <input type="number" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="20" className="drop-input" />
          </Field>

          <Field label="Durée">
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => (
                <button key={d.value} onClick={() => setHours(d.value)}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                    hours === d.value ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-zinc-900 border-purple-900/30 text-white/50'
                  }`}>{d.label}</button>
              ))}
            </div>
          </Field>

          <Field label="Niveau requis">
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((t) => (
                <button key={t.value} onClick={() => setTier(t.value)}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                    tier === t.value ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' : 'bg-zinc-900 border-purple-900/30 text-white/50'
                  }`}>{t.label}</button>
              ))}
            </div>
          </Field>

          <button onClick={submit} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-full text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-[0_0_18px_rgba(245,158,11,0.35)]">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Publication…</> : <><Zap className="w-4 h-4" /> Publier le Drop</>}
          </button>
          <p className="text-center text-white/30 text-[11px]">Les membres Gold et Diamond recevront une notification.</p>
        </div>
      )}

      <style jsx>{`
        :global(.drop-input) {
          width: 100%; background: #18181b; border: 1px solid rgba(120,53,15,0.4);
          border-radius: 0.75rem; padding: 0.875rem 1rem; color: white; font-size: 0.875rem;
          outline: none; transition: border-color 0.15s;
        }
        :global(.drop-input::placeholder) { color: #71717a; }
        :global(.drop-input:focus) { border-color: rgba(245,158,11,0.5); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{label}</span>
      {children}
    </div>
  )
}
