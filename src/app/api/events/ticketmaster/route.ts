import { NextResponse } from 'next/server'
import type { ExternalEvent } from '@/lib/types'

const TM_ENDPOINT = 'https://app.ticketmaster.com/discovery/v2/events.json'

// ─── Ticketmaster → VYBZ category mapping ───────────────────────────────────────
const SEGMENT_MAP: Record<string, string> = {
  Music: 'Concerts & Live Music',
  'Arts & Theatre': 'Culture & Art',
  Arts: 'Culture & Art',
  Film: 'Culture & Art',
  Sports: 'Wellness & Outdoor',
  Miscellaneous: 'Experiences',
}

function mapCategory(segment?: string): string {
  if (!segment) return 'Experiences'
  return SEGMENT_MAP[segment] ?? 'Experiences'
}

// ─── Ticketmaster response shapes (only the fields we use) ──────────────────────
interface TMImage { url: string; width?: number; height?: number; ratio?: string }
interface TMPriceRange { min?: number; max?: number; currency?: string }
interface TMVenue {
  name?: string
  city?: { name?: string }
  address?: { line1?: string }
}
interface TMClassification {
  segment?: { name?: string }
  genre?: { name?: string }
}
interface TMEvent {
  id: string
  name: string
  url?: string
  info?: string
  pleaseNote?: string
  description?: string
  images?: TMImage[]
  dates?: { start?: { localDate?: string; localTime?: string } }
  priceRanges?: TMPriceRange[]
  classifications?: TMClassification[]
  _embedded?: { venues?: TMVenue[] }
}
interface TMResponse {
  _embedded?: { events?: TMEvent[] }
  page?: { totalElements?: number; totalPages?: number; number?: number }
}

/** Pick the best available image: prefer wide 16:9, then largest width. */
function pickImage(images?: TMImage[]): string | null {
  if (!images || images.length === 0) return null
  const wide = images
    .filter((i) => i.ratio === '16_9' && i.url)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  if (wide[0]) return wide[0].url
  const any = [...images].filter((i) => i.url).sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  return any[0]?.url ?? null
}

function normalize(ev: TMEvent): ExternalEvent {
  const venue = ev._embedded?.venues?.[0]
  const cls = ev.classifications?.[0]
  const price = ev.priceRanges?.[0]
  const priceMin = typeof price?.min === 'number' ? price.min : null

  return {
    id: `tm_${ev.id}`,
    title: ev.name,
    description: ev.info ?? ev.description ?? ev.pleaseNote ?? null,
    cover_image: pickImage(ev.images),
    city: venue?.city?.name ?? null,
    category: mapCategory(cls?.segment?.name),
    event_date: ev.dates?.start?.localDate ?? '',
    start_time: ev.dates?.start?.localTime ? ev.dates.start.localTime.slice(0, 5) : null,
    price_min: priceMin,
    currency: price?.currency ?? null,
    is_free: priceMin === 0,
    venue_name: venue?.name ?? null,
    venue_address: venue?.address?.line1 ?? null,
    url: ev.url ?? 'https://www.ticketmaster.com',
    source: 'ticketmaster',
  }
}

export async function GET(request: Request) {
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { events: [], error: 'TICKETMASTER_API_KEY not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') ?? ''
  const countryCode = searchParams.get('countryCode') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const page = searchParams.get('page') ?? '0'
  const size = searchParams.get('size') ?? '20'

  const tmParams = new URLSearchParams({
    apikey: apiKey,
    sort: 'date,asc',
    page,
    size,
  })
  if (city) tmParams.set('city', city)
  if (countryCode) tmParams.set('countryCode', countryCode)
  if (keyword) tmParams.set('keyword', keyword)

  try {
    const res = await fetch(`${TM_ENDPOINT}?${tmParams.toString()}`, {
      // Cache results for 10 minutes — external listings don't change by the second
      next: { revalidate: 600 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { events: [], error: `Ticketmaster responded ${res.status}` },
        { status: 200 }
      )
    }

    const data = (await res.json()) as TMResponse
    const rawEvents = data._embedded?.events ?? []
    const events = rawEvents.filter((e) => e.dates?.start?.localDate).map(normalize)

    return NextResponse.json({
      events,
      page: data.page?.number ?? 0,
      totalPages: data.page?.totalPages ?? 0,
      total: data.page?.totalElements ?? events.length,
    })
  } catch {
    // Network / parsing failure — fail soft so the UI can fall back gracefully
    return NextResponse.json({ events: [], error: 'fetch_failed' }, { status: 200 })
  }
}
