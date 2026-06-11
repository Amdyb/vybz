'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Loader2, CheckCircle2, Gift, AlertCircle, Users,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Reward } from '@/lib/types'

type OrgEvent = { id: string; title: string }

const TIERS: { value: 'all' | 'gold' | 'diamond'; label: string }[] = [
  { value: 'all',     label: 'Tous' },
  { value: 'gold',    label: 'Gold et +' },
  { value: 'diamond', label: 'Diamond' },
]

export default function CreateRewardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)
  const [events, setEvents]   = useState<OrgEvent[]>([])
  const [myRewards, setMyRewards] = useState<Reward[]>([])
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [eventId, setEventId]   = useState('')
  const [pts, setPts]           = useState('250')
  const [quantity, setQuantity] = useState('20')
  const [tier, setTier]         = useState<'all' | 'gold' | 'diamond'>('all')
  const [expiry, setExpiry]     = useState('')

  const loadMine = async (uid: string) => {
    const { data } = await supabase.from('rewards').select('*').eq('organizer_id', uid).order('created_at', { ascending: false })
    setMyRewards((data ?? []) as Reward[])
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      setUserId(user.id)
      const { data } = await supabase.from('events').select('id, title').eq('organizer_id', user.id).order('event_date', { ascending: true })
      setEvents((data ?? []) as OrgEvent[])
      await loadMine(user.id)
      setLoading(false)
    })
  }, [router])

  async function submit() {
    if (!userId) return
    setError('')
    if (!title.trim()) { setError('Donne un titre à la récompense.'); return }
    const pNum = parseInt(pts, 10)
    if (isNaN(pNum) || pNum < 0) { setError('Indique un nombre de points valide.'); return }
    const qty = parseInt(quantity, 10)
    if (!qty || qty < 1) { setError('Indique une quantité valide.'); return }

    setSaving(true)
    const { error: insErr } = await supabase.from('rewards').insert({
      organizer_id: userId,
      event_id: eventId || null,
      title: title.trim(),
      description: desc.trim() || null,
      points_required: pNum,
      quantity_available: qty,
      tier_required: tier,
      is_active: true,
      expires_at: expiry ? new Date(expiry + 'T23:59:59').toISOString() : null,
    } as never)

    if (insErr) {
      setError('Une erreur est survenue. Réessaie.')
      setSaving(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/rewards'), 1200)
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
        <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Récompense publiée !</h1>
        <p className="text-white/50 text-sm">Les membres avec assez de points ont été notifiés.</p>
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
          <Gift className="w-5 h-5 text-amber-400" />
        </span>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Créer une récompense</h1>
      </div>

      <div className="space-y-5">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <Field label="Titre">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Ex: Entrée VIP offerte" className="rwd-input" />
        </Field>

        <Field label="Description (optionnel)">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 200))} rows={2} placeholder="Ce que le membre obtient…" className="rwd-input resize-none" />
        </Field>

        <Field label="Événement lié (optionnel)">
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="rwd-input">
            <option value="">Aucun</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Points requis"><input type="number" inputMode="numeric" value={pts} onChange={(e) => setPts(e.target.value)} placeholder="250" className="rwd-input" /></Field>
          <Field label="Quantité"><input type="number" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="20" className="rwd-input" /></Field>
        </div>

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

        <Field label="Expiration (optionnel)">
          <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="rwd-input" />
        </Field>

        <button onClick={submit} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-3.5 rounded-full text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-[0_0_18px_rgba(245,158,11,0.35)]">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Publication…</> : <><Gift className="w-4 h-4" /> Publier la récompense</>}
        </button>
        <p className="text-center text-white/30 text-[11px]">Les membres ayant assez de points seront notifiés.</p>
      </div>

      {/* Existing rewards + claim counts */}
      {myRewards.length > 0 && (
        <div className="mt-9">
          <h2 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-3">Mes récompenses</h2>
          <div className="space-y-2">
            {myRewards.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-zinc-900 border border-amber-900/30 rounded-2xl p-3.5">
                <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4 text-amber-400" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-semibold text-sm truncate">{r.title}</span>
                  <span className="block text-white/40 text-xs">{r.points_required} pts · {r.tier_required === 'all' ? 'Tous' : r.tier_required}</span>
                </span>
                <span className="flex items-center gap-1 text-amber-300 text-xs font-bold shrink-0">
                  <Users className="w-3.5 h-3.5" />{r.quantity_claimed}/{r.quantity_available}
                </span>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-[11px] mt-3 text-center">Scanne les QR à l&apos;entrée depuis le Scanner → onglet Récompenses.</p>
        </div>
      )}

      <style jsx>{`
        :global(.rwd-input) {
          width: 100%; background: #18181b; border: 1px solid rgba(120,53,15,0.4);
          border-radius: 0.75rem; padding: 0.875rem 1rem; color: white; font-size: 0.875rem;
          outline: none; transition: border-color 0.15s;
        }
        :global(.rwd-input::placeholder) { color: #71717a; }
        :global(.rwd-input:focus) { border-color: rgba(245,158,11,0.5); }
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
