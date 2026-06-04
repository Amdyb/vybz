'use client'

import { CATEGORIES } from '@/lib/utils'

interface Props {
  active: string
  onChange: (cat: string) => void
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
            active === cat
              ? 'bg-violet-600 text-white shadow-[0_0_16px_rgba(124,58,237,0.5)]'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/[0.06]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
