'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Camera, Loader2, Check, AlertCircle, MapPin, Globe,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile, UserPreferences } from '@/lib/types'
import {
  getInitials, USER_CATEGORIES, CATEGORY_COLORS,
  MUSIC_GENRES, GOING_OUT_FREQUENCIES, PREFERRED_NIGHTS,
} from '@/lib/utils'

const BIO_MAX = 150
const USERNAME_RE = /^[a-z0-9_]{3,20}$/

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function EditProfilePage() {
  const router = useRouter()

  const [userId, setUserId]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Form fields
  const [fullName, setFullName]   = useState('')
  const [username, setUsername]   = useState('')
  const [initialUsername, setInitialUsername] = useState('')
  const [bio, setBio]             = useState('')
  const [city, setCity]           = useState('')
  const [categories, setCategories] = useState<string[]>([])

  // New preferences (user_preferences jsonb)
  const [homeCity, setHomeCity]   = useState('')
  const [genres, setGenres]       = useState<string[]>([])
  const [frequency, setFrequency] = useState('')
  const [nights, setNights]       = useState<string[]>([])

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Username availability
  const [usernameState, setUsernameState] = useState<UsernameState>('idle')

  // ── Load current profile ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const p = data as Profile | null
      setFullName(p?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? '')
      setUsername(p?.username ?? '')
      setInitialUsername(p?.username ?? '')
      setBio(p?.bio ?? '')
      setCity(p?.city ?? '')
      setCategories(p?.favorite_categories ?? [])
      setAvatarUrl(p?.avatar_url ?? null)

      const prefs = p?.user_preferences
      setHomeCity(prefs?.home_city ?? '')
      setGenres(prefs?.music_genres ?? [])
      setFrequency(prefs?.going_out_frequency ?? '')
      setNights(prefs?.preferred_nights ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  // ── Username uniqueness check (debounced) ─────────────────────────────────
  useEffect(() => {
    const u = username.trim().toLowerCase()
    if (u === initialUsername.toLowerCase()) { setUsernameState('idle'); return }
    if (!u) { setUsernameState('idle'); return }
    if (!USERNAME_RE.test(u)) { setUsernameState('invalid'); return }

    setUsernameState('checking')
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', u)
        .neq('id', userId ?? '')
        .maybeSingle()
      setUsernameState(data ? 'taken' : 'available')
    }, 400)
    return () => clearTimeout(timer)
  }, [username, initialUsername, userId])

  function pickAvatar(f: File) {
    if (!f.type.startsWith('image/')) { setError('Seules les images sont acceptées.'); return }
    if (f.size > 10 * 1024 * 1024) { setError('Image trop volumineuse (max 10 Mo).'); return }
    setError('')
    setAvatarFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : prev.length >= 3 ? prev : [...prev, cat]
    )
  }

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (item: string) =>
    set((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])

  async function handleSave() {
    if (!userId) return
    setError('')

    if (!fullName.trim()) { setError('Le nom est requis.'); return }
    const uname = username.trim().toLowerCase()
    if (uname && !USERNAME_RE.test(uname)) {
      setError("Le nom d'utilisateur doit faire 3 à 20 caractères (lettres, chiffres, _).")
      return
    }
    if (usernameState === 'taken') { setError("Ce nom d'utilisateur est déjà pris."); return }

    setSaving(true)

    // 1. Upload avatar if changed
    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { contentType: avatarFile.type, upsert: true })
      if (upErr) {
        setError('Erreur lors du téléchargement de la photo.')
        setSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      newAvatarUrl = publicUrl
    }

    // 2. Upsert profile
    type ProfileUpdate = {
      id: string
      full_name: string
      username: string | null
      bio: string | null
      city: string | null
      favorite_categories: string[]
      avatar_url: string | null
      user_preferences: UserPreferences
    }
    const payload: ProfileUpdate = {
      id: userId,
      full_name: fullName.trim(),
      username: uname || null,
      bio: bio.trim() || null,
      city: city.trim() || null,
      favorite_categories: categories,
      avatar_url: newAvatarUrl,
      user_preferences: {
        home_city: homeCity.trim() || null,
        music_genres: genres,
        going_out_frequency: frequency || null,
        preferred_nights: nights,
      },
    }

    const { error: saveErr } = await supabase
      .from('profiles')
      .upsert(payload as never, { onConflict: 'id' })

    if (saveErr) {
      setError(
        saveErr.code === '23505'
          ? "Ce nom d'utilisateur est déjà pris."
          : 'Une erreur est survenue. Réessaie.'
      )
      setSaving(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
      </div>
    )
  }

  const bioLeft = BIO_MAX - bio.length
  const shownAvatar = avatarPreview ?? avatarUrl

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </Link>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            Modifier le profil
          </h1>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative group"
          >
            {shownAvatar ? (
              <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-purple-500/30">
                <Image src={shownAvatar} alt="Avatar" fill className="object-cover" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-black select-none">
                {getInitials(fullName || 'U')}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-fuchsia-500 border-2 border-[#08080F] flex items-center justify-center group-hover:bg-fuchsia-400 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickAvatar(f) }}
          />
        </div>

        <div className="space-y-5">
          {/* Display name */}
          <Field label="Nom affiché">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom"
              className="vybz-input"
            />
          </Field>

          {/* Username */}
          <Field label="Nom d'utilisateur">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                placeholder="username"
                maxLength={20}
                className="vybz-input pl-8 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameState === 'checking' && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                {usernameState === 'available' && <Check className="w-4 h-4 text-emerald-400" />}
                {(usernameState === 'taken' || usernameState === 'invalid') && <AlertCircle className="w-4 h-4 text-red-400" />}
              </span>
            </div>
            {usernameState === 'taken' && <Hint color="text-red-400">Déjà pris — essayez un autre.</Hint>}
            {usernameState === 'invalid' && <Hint color="text-red-400">3–20 caractères : lettres, chiffres, _</Hint>}
            {usernameState === 'available' && <Hint color="text-emerald-400">Disponible</Hint>}
          </Field>

          {/* Bio */}
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Parlez de vous en quelques mots…"
              rows={3}
              className="vybz-input resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-[11px] ${bioLeft < 20 ? 'text-amber-400' : 'text-zinc-600'}`}>
                {bioLeft} caractères restants
              </span>
            </div>
          </Field>

          {/* City */}
          <Field label="Ville">
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Dakar"
                className="vybz-input pl-10"
              />
            </div>
          </Field>

          {/* Favorite categories */}
          <Field label={`Catégories favorites (${categories.length}/3)`}>
            <div className="flex flex-wrap gap-2">
              {USER_CATEGORIES.map((cat) => {
                const active = categories.includes(cat)
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-full border transition-all active:scale-95 ${
                      active
                        ? (CATEGORY_COLORS[cat] ?? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30')
                        : 'bg-zinc-900 text-zinc-500 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Home city (Diaspora Mode) */}
          <Field label="Ville d'origine">
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                placeholder="Ex: Abidjan"
                className="vybz-input pl-10"
              />
            </div>
            <Hint color="text-zinc-600">Pour le Mode Diaspora : les events de chez toi, où que tu sois.</Hint>
          </Field>

          {/* Music genres */}
          <Field label="Genres musicaux">
            <div className="flex flex-wrap gap-2">
              {MUSIC_GENRES.map((genre) => {
                const active = genres.includes(genre)
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggle(setGenres)(genre)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border transition-all active:scale-95 ${
                      active
                        ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/40'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {genre}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Going-out frequency */}
          <Field label="Fréquence de sortie">
            <div className="flex flex-wrap gap-2">
              {GOING_OUT_FREQUENCIES.map((opt) => {
                const active = frequency === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFrequency(active ? '' : opt)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border transition-all active:scale-95 ${
                      active
                        ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/40'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {opt}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Preferred nights */}
          <Field label="Soirs préférés">
            <div className="flex flex-wrap gap-2">
              {PREFERRED_NIGHTS.map((nightOpt) => {
                const active = nights.includes(nightOpt)
                return (
                  <button
                    key={nightOpt}
                    type="button"
                    onClick={() => toggle(setNights)(nightOpt)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border transition-all active:scale-95 ${
                      active
                        ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    {nightOpt}
                  </button>
                )
              })}
            </div>
          </Field>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || usernameState === 'checking' || usernameState === 'taken' || usernameState === 'invalid'}
          className="w-full mt-8 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
          ) : (
            <><Check className="w-4 h-4" /> Enregistrer</>
          )}
        </button>
      </div>

      <style jsx>{`
        :global(.vybz-input) {
          width: 100%;
          background: #18181b;
          border: 1px solid rgba(88, 28, 135, 0.3);
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.vybz-input::placeholder) { color: #71717a; }
        :global(.vybz-input:focus) { border-color: rgba(217, 70, 239, 0.5); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      {children}
    </div>
  )
}

function Hint({ color, children }: { color: string; children: React.ReactNode }) {
  return <p className={`text-[11px] mt-1.5 ${color}`}>{children}</p>
}
