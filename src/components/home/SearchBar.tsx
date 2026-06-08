'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

const FILTERS = [
  { label: 'Tout',         value: 'all' },
  { label: 'Ce soir',      value: 'tonight' },
  { label: 'Gratuit',      value: 'free' },
  { label: 'Sorties',      value: 'sorties' },
  { label: 'Concerts',     value: 'concerts' },
  { label: 'Food',         value: 'food' },
  { label: 'Culture',      value: 'culture' },
  { label: 'Wellness',     value: 'wellness' },
  { label: 'Expériences',  value: 'experiences' },
]

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  return (
    <div className="px-4 mb-6">
      {/* Search input */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un événement, lieu..."
          className="w-full bg-zinc-900 border border-purple-900/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-fuchsia-500/50 transition-colors"
        />
      </div>

      {/* Filter chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeFilter === f.value
                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 border-transparent text-white shadow-[0_0_12px_rgba(217,70,239,0.4)]'
                : 'bg-zinc-900 border-purple-900/30 text-white/50 hover:text-white/80 hover:border-purple-700/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
