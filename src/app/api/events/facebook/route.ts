import { NextResponse } from 'next/server'
import type { ExternalEvent } from '@/lib/types'

// Always evaluate at request time so the route activates the moment
// FACEBOOK_ACCESS_TOKEN is set, and never serves a build-time empty response.
export const dynamic = 'force-dynamic'

// ─── Facebook Graph API — events ────────────────────────────────────────────────
//
// SCAFFOLD: ready to activate once Meta approves Events access for the app.
//
// Set FACEBOOK_ACCESS_TOKEN to switch this route on. Until then it returns an
// empty list (HTTP 200) so the home row and the /events "Externes" tab hide
// gracefully — exactly like the Ticketmaster/Eventbrite routes.
//
// Note: Facebook retired the public `/search?type=event` endpoint in 2018, so a
// live integration will most likely read events per managed Page
// (`/{page-id}/events`) or via an approved partner endpoint. The exact endpoint
// is therefore configurable via FACEBOOK_EVENTS_ENDPOINT; the default targets the
// Graph search edge and fails soft if Meta rejects it.

const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || 'v19.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

// Fields we map onto the VYBZ event shape.
const EVENT_FIELDS =
  'id,name,description,start_time,end_time,is_online,is_canceled,ticket_uri,' +
  'cover{source},place{name,location{city,street,country,latitude,longitude}}'

// Facebook events have no clean public category taxonomy — default to Experiences,
// matching the VYBZ "else → Experiences" rule used by the other providers.
function mapCategory(name?: string): string {
  const n = (name ?? '').toLowerCase()
  if (n.includes('concert') || n.includes('music') || n.includes('dj') || n.includes('live')) return 'Concerts & Live Music'
  if (n.includes('art') || n.includes('expo') || n.includes('cinema') || n.includes('film') || n.includes('cultur') || n.includes('theatre')) return 'Culture & Art'
  if (n.includes('sport') || n.includes('fitness') || n.includes('yoga') || n.includes('wellness')) return 'Wellness & Outdoor'
  if (n.includes('food') || n.includes('drink') || n.includes('brunch') || n.includes('dîner') || n.includes('diner')) return 'Food & Drinks'
  return 'Experiences'
}

// ─── Graph response shapes (only the fields we use) ─────────────────────────────
interface FBCover { source?: string }
interface FBLocation { city?: string; street?: string; country?: string; latitude?: number; longitude?: number }
interface FBPlace { name?: string; location?: FBLocation }
interface FBEvent {
  id: string
  name?: string
  description?: string
  start_time?: string
  end_time?: string
  is_online?: boolean
  is_canceled?: boolean
  ticket_uri?: string
  cover?: FBCover
  place?: FBPlace
}
interface FBResponse {
  data?: FBEvent[]
  paging?: { cursors?: { after?: string }; next?: string }
  error?: { message?: string; code?: number }
}

function normalize(ev: FBEvent): ExternalEvent {
  // start_time looks like "2024-07-20T19:00:00+0100"
  const [date, rest] = (ev.start_time ?? '').split('T')
  const start_time = rest ? rest.slice(0, 5) : null

  return {
    id: `fb_${ev.id}`,
    title: ev.name ?? 'Événement',
    description: ev.description ?? null,
    cover_image: ev.cover?.source ?? null,
    city: ev.place?.location?.city ?? null,
    category: mapCategory(ev.name),
    event_date: date ?? '',
    start_time,
    // Facebook's API does not expose ticket pricing — leave it to the click-through.
    price_min: null,
    currency: null,
    is_free: false,
    venue_name: ev.place?.name ?? null,
    venue_address: ev.place?.location?.street ?? ev.place?.location?.city ?? null,
    url: ev.ticket_uri || `https://www.facebook.com/events/${ev.id}`,
    source: 'facebook',
  }
}

export async function GET(request: Request) {
  const token = process.env.FACEBOOK_ACCESS_TOKEN
  // Not configured (awaiting Meta approval) — return an empty list so the UI hides.
  if (!token) {
    return NextResponse.json({ events: [], error: 'FACEBOOK_ACCESS_TOKEN not configured' })
  }

  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const limit = searchParams.get('size') ?? '20'

  // Date window: from today through the next 60 days (unix seconds).
  const now = Math.floor(Date.now() / 1000)
  const until = now + 60 * 24 * 60 * 60

  // Default to the Graph search edge; override with FACEBOOK_EVENTS_ENDPOINT
  // (e.g. `${GRAPH_BASE}/{page-id}/events`) once the approved source is known.
  const endpoint = process.env.FACEBOOK_EVENTS_ENDPOINT || `${GRAPH_BASE}/search`

  const params = new URLSearchParams({
    access_token: token,
    fields: EVENT_FIELDS,
    since: String(now),
    until: String(until),
    limit,
  })
  // The search edge requires type=event; a page-events edge ignores it harmlessly.
  if (endpoint.endsWith('/search')) params.set('type', 'event')
  const q = keyword || city
  if (q) params.set('q', q)

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`, {
      next: { revalidate: 600 }, // cache 10 minutes
    })

    if (!res.ok) {
      // Permission/endpoint not yet granted — fail soft.
      return NextResponse.json(
        { events: [], error: `Facebook responded ${res.status}` },
        { status: 200 },
      )
    }

    const data = (await res.json()) as FBResponse
    if (data.error) {
      return NextResponse.json({ events: [], error: data.error.message ?? 'facebook_error' }, { status: 200 })
    }

    const events = (data.data ?? [])
      .filter((e) => e.start_time && !e.is_canceled && !e.is_online)
      .map(normalize)

    return NextResponse.json({ events, total: events.length })
  } catch {
    return NextResponse.json({ events: [], error: 'fetch_failed' }, { status: 200 })
  }
}
