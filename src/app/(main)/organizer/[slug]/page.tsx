import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import type { Venue, EventWithVenue } from '@/lib/types'
import OrganizerContent from './OrganizerContent'

export const revalidate = 60

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getVenue(slug: string): Promise<Venue | null> {
  const { data } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data as Venue | null
}

async function getVenueEvents(venueId: string): Promise<EventWithVenue[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('venue_id', venueId)
    .eq('status', 'published')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(50)
  return (data as EventWithVenue[]) ?? []
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const venue = await getVenue(params.slug)
  if (!venue) return { title: 'Page introuvable — VYBZ' }
  return {
    title: `${venue.name} — VYBZ`,
    description: venue.description ?? `Découvrez ${venue.name} sur VYBZ — événements et soirées à ${venue.city}.`,
    openGraph: {
      title: `${venue.name} — VYBZ`,
      description: venue.description ?? `Tous les événements de ${venue.name}`,
      images: venue.cover_image ? [venue.cover_image] : [],
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrganizerPage(
  { params }: { params: { slug: string } }
) {
  const venue = await getVenue(params.slug)
  if (!venue) notFound()

  const events = await getVenueEvents(venue.id)

  return <OrganizerContent venue={venue} events={events} />
}
