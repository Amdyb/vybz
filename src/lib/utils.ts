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

export const VENUE_CATEGORY_COLORS: Record<string, string> = {
  'Beach Club': 'bg-cyan-500/20 text-cyan-300',
  Club:         'bg-purple-500/20 text-purple-300',
  Rooftop:      'bg-sky-500/20 text-sky-300',
  Lounge:       'bg-amber-500/20 text-amber-300',
  Restaurant:   'bg-emerald-500/20 text-emerald-300',
}
