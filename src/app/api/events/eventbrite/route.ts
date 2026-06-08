import { NextResponse } from 'next/server'
import type { ExternalEvent } from '@/lib/types'

const EB_ENDPOINT = 'https://www.eventbriteapi.com/v3/events/search/'

// ─── Eventbrite category_id → VYBZ category ─────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  '103': 'Concerts & Live Music', // Music
  '104': 'Culture & Art',         // Film & Media
  '105': 'Culture & Art',         // Performing & Visual Arts
  '108': 'Wellness & Outdoor',    // Sports & Fitness
  '107': 'Wellness & Outdoor',    // Health & Wellness
  '110': 'Food & Drinks',         // Food & Drink
  '113': 'Culture & Art',         // Community & Culture
  '109': 'Experiences',           // Travel & Outdoor
  '102': 'Experiences',           // Science & Tech
  '101': 'Experiences',           // Business
}

function mapCategory(categoryId?: string | null, name?: string): string {
  if (categoryId && CATEGORY_MAP[categoryId]) return CATEGORY_MAP[categoryId]
  const n = (name ?? '').toLowerCase()
  if (n.includes('music')) return 'Concerts & Live Music'
  if (n.includes('art') || n.includes('film') || n.includes('cultur') || n.includes('theatre')) return 'Culture & Art'
  if (n.includes('sport') || n.includes('fitness') || n.includes('health') || n.includes('wellness')) return 'Wellness & Outdoor'
  if (n.includes('food') || n.includes('drink')) return 'Food & Drinks'
  return 'Experiences'
}

// ─── Eventbrite response shapes (only the fields we use) ────────────────────────
interface EBText { text?: string }
interface EBLogo { url?: string; original?: { url?: string } }
interface EBAddress { city?: string; localized_address_display?: string; address_1?: string }
interface EBVenue { name?: string; address?: EBAddress }
interface EBPrice { major_value?: string; currency?: string }
interface EBTicketAvailability { minimum_ticket_price?: EBPrice; is_free?: boolean }
interface EBCategory { name?: string }
interface EBEvent {
  id: string
  name?: EBText
  description?: EBText
  url?: string
  logo?: EBLogo
  start?: { local?: string; utc?: string }
  is_free?: boolean
  category_id?: string | null
  category?: EBCategory
  venue?: EBVenue
  ticket_availability?: EBTicketAvailability
}
interface EBResponse {
  events?: EBEvent[]
  pagination?: { page_number?: number; page_count?: number; object_count?: number }
}

function normalize(ev: EBEvent): ExternalEvent {
  const local = ev.start?.local ?? ''
  const [date, time] = local.split('T')
  const priceRaw = ev.ticket_availability?.minimum_ticket_price?.major_value
  const priceMin = priceRaw != null && priceRaw !== '' ? Number(priceRaw) : null
  const isFree = ev.is_free ?? ev.ticket_availability?.is_free ?? priceMin === 0

  return {
    id: `eb_${ev.id}`,
    title: ev.name?.text ?? 'Événement',
    description: ev.description?.text ?? null,
    cover_image: ev.logo?.original?.url ?? ev.logo?.url ?? null,
    city: ev.venue?.address?.city ?? null,
    category: mapCategory(ev.category_id, ev.category?.name),
    event_date: date ?? '',
    start_time: time ? time.slice(0, 5) : null,
    price_min: Number.isFinite(priceMin as number) ? priceMin : null,
    currency: ev.ticket_availability?.minimum_ticket_price?.currency ?? null,
    is_free: !!isFree,
    venue_name: ev.venue?.name ?? null,
    venue_address: ev.venue?.address?.localized_address_display ?? ev.venue?.address?.address_1 ?? null,
    url: ev.url ?? 'https://www.eventbrite.com',
    source: 'eventbrite',
  }
}

export async function GET(request: Request) {
  const token = process.env.EVENTBRITE_API_KEY
  if (!token) {
    return NextResponse.json(
      { events: [], error: 'EVENTBRITE_API_KEY not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') ?? ''
  const countryCode = searchParams.get('countryCode') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const page = searchParams.get('page') ?? '1'

  const ebParams = new URLSearchParams({
    'expand': 'venue,ticket_availability,category',
    'sort_by': 'date',
    'page': page,
  })
  if (city) ebParams.set('location.address', countryCode ? `${city}, ${countryCode}` : city)
  if (city) ebParams.set('location.within', '50km')
  if (keyword) ebParams.set('q', keyword)

  try {
    const res = await fetch(`${EB_ENDPOINT}?${ebParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 600 }, // cache 10 minutes
    })

    if (!res.ok) {
      // Eventbrite removed public search for many accounts — fail soft
      return NextResponse.json(
        { events: [], error: `Eventbrite responded ${res.status}` },
        { status: 200 }
      )
    }

    const data = (await res.json()) as EBResponse
    const events = (data.events ?? [])
      .filter((e) => e.start?.local)
      .map(normalize)

    return NextResponse.json({
      events,
      page: data.pagination?.page_number ?? 1,
      totalPages: data.pagination?.page_count ?? 0,
      total: data.pagination?.object_count ?? events.length,
    })
  } catch {
    return NextResponse.json({ events: [], error: 'fetch_failed' }, { status: 200 })
  }
}
