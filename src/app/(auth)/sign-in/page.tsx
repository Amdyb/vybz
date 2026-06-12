'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

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
              src="/vybz-logo.svg"
              alt="VYBZ" unoptimized
              width={80}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </Link>
        </div>

        <h1 className="font-black text-2xl text-white text-center mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          Se connecter
        </h1>
        <p className="text-zinc-400 text-sm text-center mb-8">
          Content de te revoir sur VYBZ
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion…
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Pas encore de compte ?{' '}
          <Link href="/sign-up" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
  if (msg.includes('Too many requests')) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  return 'Une erreur est survenue. Réessaie.'
}
