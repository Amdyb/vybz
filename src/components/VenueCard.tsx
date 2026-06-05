import Image from 'next/image'
import Link from 'next/link'
import type { Venue } from '@/lib/types'
import { VENUE_CATEGORY_COLORS } from '@/lib/utils'

const VENUE_GRADIENTS: Record<string, string> = {
  'Beach Club': 'from-cyan-900/60 via-teal-900/40 to-black/60',
  Club:         'from-violet-900/60 via-purple-900/40 to-black/60',
  Rooftop:      'from-sky-900/60 via-blue-900/40 to-black/60',
  Lounge:       'from-amber-900/60 via-yellow-900/40 to-black/60',
  Restaurant:   'from-emerald-900/60 via-green-900/40 to-black/60',
}

export default function VenueCard({ venue }: { venue: Venue }) {
  const gradient = VENUE_GRADIENTS[venue.category] ?? 'from-gray-900/60 to-black/60'
  const badgeClass = VENUE_CATEGORY_COLORS[venue.category] ?? 'bg-white/10 text-white/60'

  return (
    <Link href={`/venues/${venue.id}`} className="group block">
      <div className="rounded-2xl overflow-hidden bg-[#0f0f1a] border border-white/[0.06] hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:-translate-y-0.5">
        <div className={`relative h-36 flex items-end p-4 ${venue.cover_image ? 'bg-black' : `bg-gradient-to-br ${gradient}`}`}>
          {venue.cover_image && (
            <Image
              src={venue.cover_image}
              alt={venue.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {venue.is_verified && (
            <div className="absolute top-3 right-3 z-10 bg-violet-600/80 backdrop-blur-sm rounded-full p-1" title="Vérifié">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <span className={`relative z-10 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeClass}`}>
            {venue.category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white/90 text-sm group-hover:text-white transition-colors mb-1">
            {venue.name}
          </h3>
          {venue.address && (
            <p className="text-white/40 text-xs flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {venue.address}
            </p>
          )}
          {(venue.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs text-white/60">{venue.rating}</span>
              <span className="text-xs text-white/30">({venue.review_count})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
