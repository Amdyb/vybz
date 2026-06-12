'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  User, Building2, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft,
  Check, ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AccountType = 'user' | 'organizer'

const ACCOUNT_CARDS: {
  type: AccountType
  icon: React.ElementType
  title: string
  description: string
  features: string[]
}[] = [
  {
    type: 'user',
    icon: User,
    title: 'Utilisateur',
    description: 'Découvrez des événements, achetez des tickets, vivez des expériences uniques',
    features: ['Découverte d\'événements', 'Achat de tickets', 'Pulse Points et récompenses', 'Social et crew'],
  },
  {
    type: 'organizer',
    icon: Building2,
    title: 'Organisateur',
    description: 'Créez des événements, vendez des tickets, gérez votre audience',
    features: ['Création d\'événements', 'Vente de tickets', 'Dashboard analytiques', 'Page organisateur personnalisée'],
  },
]

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [accountType, setAccountType] = useState<AccountType | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim(), account_type: accountType } },
    })

    if (authError) {
      setError(translateError(authError.message))
      setLoading(false)
      return
    }

    // Route to the onboarding flow matching the chosen account type
    router.push(accountType === 'organizer' ? '/onboarding/organizer' : '/onboarding/user')
  }

  // ── Step 1: Account type selection ──────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Link href="/">
              <Image src="/vybz-logo.webp" alt="VYBZ" width={72} height={72} className="h-18 w-auto" priority />
            </Link>
          </div>

          <h1 className="font-black text-2xl text-white text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Bienvenue sur VYBZ
          </h1>
          <p className="text-zinc-400 text-sm text-center mb-8">
            Quel type de compte souhaitez-vous créer ?
          </p>

          <div className="space-y-4">
            {ACCOUNT_CARDS.map((card) => {
              const Icon = card.icon
              const selected = accountType === card.type
              return (
                <button
                  key={card.type}
                  onClick={() => setAccountType(card.type)}
                  className={`w-full text-left rounded-[1.75rem] p-[1.5px] transition-all active:scale-[0.99] ${
                    selected
                      ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-400'
                      : 'bg-purple-900/30'
                  }`}
                >
                  <div className="rounded-[1.65rem] bg-zinc-900 p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        selected ? 'bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20' : 'bg-white/5'
                      }`}>
                        <Icon className={`w-5 h-5 ${selected ? 'text-fuchsia-300' : 'text-white/60'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                            {card.title}
                          </h2>
                          {selected && (
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{card.description}</p>
                      </div>
                    </div>

                    <ul className="mt-4 grid grid-cols-1 gap-1.5">
                      {card.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'text-cyan-400' : 'text-zinc-600'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => accountType && setStep(2)}
            disabled={!accountType}
            className="w-full mt-8 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuer
            <ChevronRight className="w-4 h-4" />
          </button>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/sign-in" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Step 2: Sign-up form ────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/vybz-logo.webp" alt="VYBZ" width={72} height={72} className="h-18 w-auto" priority />
          </Link>
        </div>

        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold mb-5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Type de compte
        </button>

        <h1 className="font-black text-2xl text-white text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Créer un compte
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-2">
          {accountType === 'organizer' ? 'Compte Organisateur' : 'Compte Utilisateur'}
        </p>
        <p className="text-zinc-500 text-xs text-center mb-8">Rejoins la communauté VYBZ</p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text" placeholder="Nom complet" autoComplete="name" required
              value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="email" placeholder="Email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" autoComplete="new-password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type={showConfirm ? 'text' : 'password'} placeholder="Confirmer le mot de passe" autoComplete="new-password" required
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Création du compte…</>) : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Déjà un compte ?{' '}
          <Link href="/sign-in" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('User already registered')) return 'Cet email est déjà utilisé.'
  if (msg.includes('Password should be')) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (msg.includes('Unable to validate email')) return 'Adresse email invalide.'
  if (msg.includes('Too many requests')) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  return 'Une erreur est survenue. Réessaie.'
}
