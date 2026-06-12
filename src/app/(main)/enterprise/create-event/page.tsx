'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft, Loader2, CheckCircle2, Check, Upload, X,
  CalendarDays, Clock, MapPin, Tag, AlignLeft,
  Image as ImageIcon, Ticket, Phone, FileText,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Nightlife', 'Rooftop', 'Jazz', 'Underground',
  'Culture', 'Food & Brunch', 'Live Music', 'Concert',
]

const PAYMENT_METHODS = [
  { id: 'Wave',            label: 'Wave' },
  { id: 'Orange Money',    label: 'Orange Money' },
  { id: 'PayPal',          label: 'PayPal' },
  { id: 'Stripe',          label: 'Stripe' },
  { id: 'Cash on arrival', label: 'Espèces sur place' },
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// ─── Types ────────────────────────────────────────────────────────────────────

interface VenueOption { id: string; name: string; city: string }

interface FormValues {
  title: string
  category: string
  event_date: string
  start_time: string
  end_time: string
  venue_id: string
  description: string
  is_free: boolean
  price_min: string
  capacity: string
  payment_methods: string[]
  whatsapp_contact: string
  refund_policy: string
}

// ─── Small reusable components ────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
      {children}
    </span>
  )
}

function FieldIcon({ icon: Icon }: { icon: React.ElementType }) {
  return <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
}

function inputCls(invalid: boolean) {
  return `w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm
    focus:outline-none transition-colors
    ${invalid ? 'border-red-500/60 focus:border-red-500' : 'border-purple-900/30 focus:border-purple-500/50'}`
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900 border border-purple-900/30 rounded-2xl p-5 space-y-4 ${className}`}>
      {children}
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [venues, setVenues]             = useState<VenueOption[]>([])
  const [authLoading, setAuthLoading]   = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [createdId, setCreatedId]       = useState<string | null>(null)
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError]     = useState('')
  const [touched, setTouched]           = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [submitError, setSubmitError]   = useState('')

  const [form, setForm] = useState<FormValues>({
    title: '', category: '', event_date: '', start_time: '', end_time: '',
    venue_id: '', description: '', is_free: false, price_min: '',
    capacity: '', payment_methods: [], whatsapp_contact: '', refund_policy: '',
  })

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setTouched(prev => ({ ...prev, [key]: true }))
  }

  function touch(key: keyof FormValues) {
    setTouched(prev => ({ ...prev, [key]: true }))
  }

  // Required fields validation
  const invalid = {
    title:      touched.title      && !form.title.trim(),
    category:   touched.category   && !form.category,
    event_date: touched.event_date && !form.event_date,
    start_time: touched.start_time && !form.start_time,
    price_min:  touched.price_min  && !form.is_free && !form.price_min,
  }

  // Auth guard + fetch venues
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if ((profile as { role?: string } | null)?.role !== 'organizer') {
        router.replace('/enterprise/onboarding')
        return
      }

      const { data: venueData } = await supabase
        .from('venues')
        .select('id, name, city')
        .order('name')

      setVenues((venueData ?? []) as VenueOption[])
      setAuthLoading(false)
    }
    init()
  }, [router])

  // Handle image selection
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      setImageError('Fichier trop volumineux (max 10 Mo)')
      return
    }
    setImageError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function togglePayment(method: string) {
    setForm(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    // Touch all required fields to show errors
    setTouched({ title: true, category: true, event_date: true, start_time: true, price_min: true })

    if (!form.title.trim() || !form.category || !form.event_date || !form.start_time) return
    if (!form.is_free && !form.price_min) return

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/sign-in'); return }

    // Upload image if provided
    let coverImageUrl: string | null = null
    if (imageFile) {
      const ext      = imageFile.name.split('.').pop() ?? 'jpg'
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('events')
        .upload(filePath, imageFile, { cacheControl: '3600', upsert: false })

      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from('events')
          .getPublicUrl(filePath)
        coverImageUrl = urlData.publicUrl
      }
    }

    // Resolve city from selected venue (fallback to Dakar)
    const selectedVenue = venues.find(v => v.id === form.venue_id)
    const city = selectedVenue?.city ?? 'Dakar'

    const payload = {
      title:            form.title.trim(),
      category:         form.category,
      event_date:       form.event_date,
      start_time:       form.start_time,
      end_time:         form.end_time || null,
      venue_id:         form.venue_id || null,
      description:      form.description || null,
      cover_image:      coverImageUrl,
      is_free:          form.is_free,
      price_min:        form.is_free ? 0 : Number(form.price_min),
      capacity:         form.capacity ? Number(form.capacity) : null,
      payment_methods:  form.payment_methods,
      whatsapp_contact: form.whatsapp_contact || null,
      refund_policy:    form.refund_policy || null,
      city,
      currency:         'XOF',
      organizer_id:     user.id,
      status:           'published',
    }

    const { data: newEvent, error: insertErr } = await supabase
      .from('events')
      .insert(payload as never)
      .select('id')
      .single()

    if (insertErr || !newEvent) {
      setSubmitError(insertErr?.message ?? 'Erreur lors de la création. Réessaie.')
      setSubmitting(false)
      return
    }

    setCreatedId((newEvent as { id: string }).id)
    setSubmitting(false)
  }

  // ── Loading state ──
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  // ── Success state ──
  if (createdId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Événement créé !
        </h1>
        <p className="text-zinc-400 text-sm mb-8 max-w-xs">
          Votre événement est maintenant publié et visible par tous les utilisateurs VYBZ.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href={`/events/${createdId}`}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold py-3 rounded-full text-sm hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="w-4 h-4" />
            Voir l&apos;événement
          </Link>
          <Link
            href="/enterprise"
            className="flex items-center justify-center gap-2 bg-zinc-900 border border-purple-900/30 text-white font-medium py-3 rounded-full text-sm hover:border-purple-500/40 transition-colors"
          >
            Retour au tableau de bord
          </Link>
          <button
            onClick={() => {
              setCreatedId(null)
              setForm({ title: '', category: '', event_date: '', start_time: '', end_time: '',
                venue_id: '', description: '', is_free: false, price_min: '',
                capacity: '', payment_methods: [], whatsapp_contact: '', refund_policy: '' })
              setImageFile(null); setImagePreview(null); setTouched({})
            }}
            className="text-zinc-500 text-sm hover:text-white transition-colors py-2"
          >
            Créer un autre événement
          </button>
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/enterprise"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 border border-purple-900/30 text-zinc-400 hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
          Créer un événement
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* ── Section 1: Informations principales ── */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-bold">Informations principales</span>
          </div>

          {/* Title */}
          <div>
            <Label>Titre de l&apos;événement *</Label>
            <input
              type="text"
              placeholder="Ex: Soirée Afrobeats au Club 54"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              onBlur={() => touch('title')}
              className={inputCls(!!invalid.title)}
            />
            {invalid.title && <p className="text-red-400 text-xs mt-1">Le titre est obligatoire</p>}
          </div>

          {/* Category */}
          <div>
            <Label>Catégorie *</Label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              onBlur={() => touch('category')}
              className={`${inputCls(!!invalid.category)} appearance-none`}
            >
              <option value="">Choisir une catégorie…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {invalid.category && <p className="text-red-400 text-xs mt-1">La catégorie est obligatoire</p>}
          </div>

          {/* Venue */}
          <div>
            <Label>Lieu</Label>
            <div className="relative">
              <FieldIcon icon={MapPin} />
              <select
                value={form.venue_id}
                onChange={e => set('venue_id', e.target.value)}
                className={`${inputCls(false)} pl-10 appearance-none`}
              >
                <option value="">Sélectionner un lieu…</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name} — {v.city}</option>
                ))}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* ── Section 2: Date & horaires ── */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-bold">Date et horaires</span>
          </div>

          {/* Date */}
          <div>
            <Label>Date *</Label>
            <div className="relative">
              <FieldIcon icon={CalendarDays} />
              <input
                type="date"
                value={form.event_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('event_date', e.target.value)}
                onBlur={() => touch('event_date')}
                className={`${inputCls(!!invalid.event_date)} pl-10 [color-scheme:dark]`}
              />
            </div>
            {invalid.event_date && <p className="text-red-400 text-xs mt-1">La date est obligatoire</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start time */}
            <div>
              <Label>Heure de début *</Label>
              <div className="relative">
                <FieldIcon icon={Clock} />
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => set('start_time', e.target.value)}
                  onBlur={() => touch('start_time')}
                  className={`${inputCls(!!invalid.start_time)} pl-10 [color-scheme:dark]`}
                />
              </div>
              {invalid.start_time && <p className="text-red-400 text-xs mt-1">Obligatoire</p>}
            </div>

            {/* End time */}
            <div>
              <Label>Heure de fin</Label>
              <div className="relative">
                <FieldIcon icon={Clock} />
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => set('end_time', e.target.value)}
                  className={`${inputCls(false)} pl-10 [color-scheme:dark]`}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Section 3: Description ── */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <AlignLeft className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-bold">Description</span>
          </div>
          <div>
            <Label>Description de l&apos;événement</Label>
            <textarea
              rows={4}
              placeholder="Décrivez votre événement, l'ambiance, les artistes, le dress code…"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className={`${inputCls(false)} resize-none leading-relaxed`}
            />
          </div>
        </SectionCard>

        {/* ── Section 4: Cover image ── */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-bold">Image de couverture</span>
          </div>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <Image
                src={imagePreview}
                alt="Aperçu"
                width={600}
                height={300}
                className="w-full h-44 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-purple-900/40 hover:border-purple-500/50 rounded-xl p-8 flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-all"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-medium">Cliquez pour télécharger</span>
              <span className="text-xs">JPG, PNG, WEBP — max 10 Mo</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          {imageError && <p className="text-red-400 text-xs">{imageError}</p>}
        </SectionCard>

        {/* ── Section 5: Billetterie ── */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-bold">Billetterie</span>
          </div>

          {/* Is free toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-white text-sm font-medium">Événement gratuit</p>
              <p className="text-zinc-500 text-xs">Aucun billet payant requis</p>
            </div>
            <Toggle value={form.is_free} onChange={v => set('is_free', v)} />
          </div>

          {/* Price — hidden when free */}
          {!form.is_free && (
            <div>
              <Label>Prix en XOF *</Label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Ex: 5000"
                  value={form.price_min}
                  onChange={e => set('price_min', e.target.value)}
                  onBlur={() => touch('price_min')}
                  className={`${inputCls(!!invalid.price_min)} pr-16`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                  XOF
                </span>
              </div>
              {invalid.price_min && <p className="text-red-400 text-xs mt-1">Le prix est obligatoire</p>}
            </div>
          )}

          {/* Capacity */}
          <div>
            <Label>Capacité (nombre de places)</Label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 200"
              value={form.capacity}
              onChange={e => set('capacity', e.target.value)}
              className={inputCls(false)}
            />
          </div>

          {/* Payment methods */}
          {!form.is_free && (
            <div>
              <Label>Modes de paiement acceptés</Label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(pm => {
                  const active = form.payment_methods.includes(pm.id)
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => togglePayment(pm.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-purple-600/30 border-purple-500/60 text-purple-300'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-purple-900/50'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                      {pm.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* WhatsApp number */}
          <div>
            <Label>Numéro WhatsApp pour la billetterie</Label>
            <div className="relative">
              <FieldIcon icon={Phone} />
              <input
                type="tel"
                placeholder="+221 77 000 00 00"
                value={form.whatsapp_contact}
                onChange={e => set('whatsapp_contact', e.target.value)}
                className={`${inputCls(false)} pl-10`}
              />
            </div>
            <p className="text-zinc-600 text-xs mt-1.5">
              Les acheteurs vous enverront leur paiement sur ce numéro
            </p>
          </div>
        </SectionCard>

        {/* ── Section 6: Politique ── */}
        <SectionCard>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm font-bold">Conditions</span>
          </div>
          <div>
            <Label>Politique de remboursement</Label>
            <textarea
              rows={3}
              placeholder="Ex: Aucun remboursement après achat. En cas d'annulation, remboursement intégral sous 48h."
              value={form.refund_policy}
              onChange={e => set('refund_policy', e.target.value)}
              className={`${inputCls(false)} resize-none`}
            />
          </div>
        </SectionCard>

        {/* ── Submit ── */}
        {submitError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold py-4 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Publication en cours…</>
          ) : (
            'Publier l\'événement'
          )}
        </button>

        <p className="text-zinc-600 text-xs text-center pb-2">
          L&apos;événement sera immédiatement visible sur VYBZ après publication.
        </p>
      </form>
    </div>
  )
}
