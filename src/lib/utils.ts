export function formatPrice(price: number | null, currency: string | null, isFree: boolean | null): string {
  if (isFree || price === 0) return 'Gratuit'
  if (!price) return ''
  return `${price.toLocaleString('fr-SN')} ${currency ?? 'XOF'}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

export const CATEGORIES = ['Tout', 'Nightlife', 'Jazz', 'Culture', 'Rooftop', 'Underground'] as const

/** Categories a user can pick as favourites (no "Tout"). */
export const USER_CATEGORIES = ['Nightlife', 'Jazz', 'Culture', 'Rooftop', 'Underground'] as const

/** Two-letter initials from a display name, for avatar fallbacks. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const CATEGORY_COLORS: Record<string, string> = {
  Nightlife: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Jazz:      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Culture:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Rooftop:   'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Underground: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

/** Returns vibe config based on recent check-in count. Pass includeCalm=true to get a label even at 0. */
export function getVibe(
  count: number,
  includeCalm = false
): { label: string; color: string; bg: string } | null {
  if (count <= 0)  return includeCalm ? { label: 'Calme', color: 'text-zinc-500', bg: 'bg-zinc-800/60 border-zinc-700/50' } : null
  if (count <= 5)  return { label: 'Ça commence',   color: 'text-blue-400',  bg: 'bg-blue-500/15 border-blue-500/25' }
  if (count <= 15) return { label: 'Bonne ambiance', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/25' }
  if (count <= 30) return { label: "C'est chaud",   color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/25' }
  return { label: 'En feu', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/25' }
}

export const VENUE_CATEGORY_COLORS: Record<string, string> = {
  'Beach Club': 'bg-cyan-500/20 text-cyan-300',
  Club:         'bg-purple-500/20 text-purple-300',
  Rooftop:      'bg-sky-500/20 text-sky-300',
  Lounge:       'bg-amber-500/20 text-amber-300',
  Restaurant:   'bg-emerald-500/20 text-emerald-300',
}

// ─── Pulse Points tiers ────────────────────────────────────────────────────────

export type TierName = 'Neon' | 'Gold' | 'Diamond'

export interface Tier {
  name: TierName
  color: string
  bg: string
  border: string
  barFrom: string
  barTo: string
  next: TierName | null
  nextAt: number | null
  prevAt: number
}

export function getTier(points: number): Tier {
  if (points >= 2000) {
    return {
      name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/30', barFrom: 'from-cyan-500', barTo: 'to-cyan-300',
      next: null, nextAt: null, prevAt: 2000,
    }
  }
  if (points >= 500) {
    return {
      name: 'Gold', color: 'text-amber-400', bg: 'bg-amber-400/10',
      border: 'border-amber-400/30', barFrom: 'from-amber-500', barTo: 'to-amber-300',
      next: 'Diamond', nextAt: 2000, prevAt: 500,
    }
  }
  return {
    name: 'Neon', color: 'text-purple-400', bg: 'bg-purple-400/10',
    border: 'border-purple-900/50', barFrom: 'from-purple-600', barTo: 'to-purple-400',
    next: 'Gold', nextAt: 500, prevAt: 0,
  }
}

export function getTierProgress(points: number, tier: Tier): number {
  if (!tier.nextAt) return 100
  const range = tier.nextAt - tier.prevAt
  return Math.min(100, ((points - tier.prevAt) / range) * 100)
}
