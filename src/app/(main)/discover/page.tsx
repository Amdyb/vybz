'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Map } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import VenueCard from '@/components/VenueCard'
import type { Venue } from '@/lib/types'

export default function DiscoverPage() {
  const [venues, setVenues]         = useState<Venue[]>([])
  const [query, setQuery]           = useState('')
  const [activeCategory, setActive] = useState('Tout')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        const v = (data as Venue[]) ?? []
        setVenues(v)
        setCategories(Array.from(new Set(v.map((x) => x.category))).sort())
        setLoading(false)
      })
  }, [])

  const filtered = venues.filter((v) => {
    const q = query.toLowerCase()
    const matchQ =
      !q ||
      v.name.toLowerCase().includes(q) ||
      (v.address?.toLowerCase().includes(q) ?? false)
    const matchC = activeCategory === 'Tout' || v.category === activeCategory
    return matchQ && matchC
  })

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#08080F]/95 backdrop-blur-sm border-b border-white/5 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black text-white">Découvrir</h1>
          <Link
            href="/map"
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white hover:border-fuchsia-500/30 transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            Carte
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un lieu..."
            className="w-full bg-zinc-900 border border-purple-900/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-fuchsia-500/50 transition-colors"
          />
        </div>

        {/* Category chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {['Tout', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 border-transparent text-white shadow-[0_0_12px_rgba(217,70,239,0.4)]'
                  : 'bg-zinc-900 border-purple-900/30 text-white/50 hover:text-white/80 hover:border-purple-700/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Venue grid */}
      <div className="px-4 py-5">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-52" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucun lieu trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
