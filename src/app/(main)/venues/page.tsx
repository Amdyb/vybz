import { supabase } from '@/lib/supabase'
import VenueCard from '@/components/VenueCard'
import type { Venue } from '@/lib/types'

export const revalidate = 60

export default async function VenuesPage() {
  const { data } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true })

  const venues = (data as Venue[]) ?? []

  const categories = Array.from(new Set(venues.map((v) => v.category))).sort()

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Lieux</h1>
        <p className="text-white/40 text-sm">Clubs, lounges & rooftops à Dakar</p>
      </div>

      {categories.map((cat) => {
        const group = venues.filter((v) => v.category === cat)
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">{cat}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {group.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
