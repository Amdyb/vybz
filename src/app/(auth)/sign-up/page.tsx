'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const router = useRouter()
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
      options: { data: { full_name: fullName.trim() } },
    })

    if (authError) {
      setError(translateError(authError.message))
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/">
            <Image
              src="/vybz-logo.png"
              alt="VYBZ"
              width={80}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </Link>
        </div>

        <h1 className="font-black text-2xl text-white text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Créer un compte
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-8">
          Rejoins la communauté VYBZ
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom complet */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Nom complet"
              autoComplete="name"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Mot de passe */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirmer le mot de passe */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirmer le mot de passe"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création du compte…
              </>
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Déjà un compte ?{' '}
          <Link href="/sign-in" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
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
