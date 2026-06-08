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
