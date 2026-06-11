export type Database = {
  public: {
    Tables: {
      events:       { Row: Event }
      venues:       { Row: Venue }
      profiles:     { Row: Profile }
      favorites:    { Row: Favorite }
      reviews:      { Row: Review }
      ticket_types: { Row: TicketType }
      orders:       { Row: Order }
      tickets:      { Row: Ticket }
      pulse_points_transactions: { Row: PulsePointsTransaction }
      stories:          { Row: Story }
      event_attendance: { Row: EventAttendance }
      follows:          { Row: Follow }
      notifications:    { Row: Notification }
      activity_feed:    { Row: ActivityFeed }
      checkins:         { Row: CheckIn }
      conversations:    { Row: Conversation }
      messages:         { Row: Message }
      crews:            { Row: Crew }
      crew_members:     { Row: CrewMember }
      drops:            { Row: Drop }
      drop_claims:      { Row: DropClaim }
    }
  }
}

export type Event = {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  venue_id: string | null
  organizer_id: string | null
  city: string
  country: string | null
  category: string
  event_date: string
  start_time: string
  end_time: string | null
  price_min: number | null
  price_max: number | null
  currency: string | null
  is_free: boolean | null
  capacity: number | null
  status: string | null
  is_featured: boolean | null
  is_sponsored: boolean | null
  payment_methods: string[] | null
  whatsapp_contact: string | null
  refund_policy: string | null
  created_at: string | null
}

export type Venue = {
  id: string
  name: string
  category: string
  address: string | null
  city: string
  country: string | null
  latitude: number | null
  longitude: number | null
  cover_image: string | null
  description: string | null
  opening_hours: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  rating: number | null
  review_count: number | null
  is_verified: boolean | null
  is_sponsored: boolean | null
  slug: string | null
  created_at: string | null
}

export type Profile = {
  id: string
  full_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  language: string | null
  role: string | null                  // 'user' | 'organizer' | 'admin'
  business_name: string | null
  subscription_plan: string | null     // 'basic' | 'pro' | 'premium'
  is_verified_organizer: boolean | null
  is_organizer: boolean | null
  organizer_preferences: OrganizerPreferences | null
  user_preferences: UserPreferences | null
  favorite_categories: string[] | null
  pulse_points: number | null
  events_attended: number | null
  reviews_count: number | null
  created_at: string | null
}

export type OrganizerPreferences = {
  business_type: string | null
  city: string | null
  country: string | null
  payment_methods: string[]
  social: {
    instagram: string | null
    whatsapp: string | null
    website: string | null
  }
}

export type UserPreferences = {
  home_city: string | null          // powers Diaspora Mode
  music_genres: string[]
  going_out_frequency: string | null
  preferred_nights: string[]
}

export type Favorite = {
  id: string
  user_id: string | null
  event_id: string | null
  venue_id: string | null
  created_at: string | null
}

export type Review = {
  id: string
  user_id: string | null
  venue_id: string | null
  rating: number | null
  comment: string | null
  created_at: string | null
}

export type TicketType = {
  id: string
  event_id: string | null
  name: string
  price: number
  currency: string | null
  quantity: number
  quantity_sold: number | null
  sale_start: string | null
  sale_end: string | null
  max_per_buyer: number | null
  created_at: string | null
}

export type Order = {
  id: string
  user_id: string | null
  event_id: string | null
  ticket_type_id: string | null
  quantity: number
  total_amount: number
  currency: string | null
  status: string | null
  payment_method: string | null
  created_at: string | null
}

export type Ticket = {
  id: string
  order_id: string | null
  event_id: string | null
  user_id: string | null
  ticket_type_id: string | null
  qr_token: string
  status: string | null
  scanned_at: string | null
  scanned_by: string | null
  created_at: string | null
}

export type PulsePointsTransaction = {
  id: string
  user_id: string
  points: number
  action: string
  description: string | null
  created_at: string
}

export type Conversation = {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'event_link' | 'venue_link' | 'ticket'
  metadata: Record<string, string | number | boolean | null>
  is_read: boolean
  created_at: string
}

export type CheckIn = {
  id: string
  user_id: string
  venue_id: string | null
  event_id: string | null
  visibility: 'public' | 'followers' | 'private'
  created_at: string
}

export type ActivityFeed = {
  id: string
  user_id: string
  action_type: 'event_attendance' | 'event_interest' | 'checkin' | 'review' | 'story' | 'event_created' | 'recommendation'
  target_id: string | null
  target_type: string | null
  metadata: Record<string, string | number | boolean | null>
  is_public: boolean
  created_at: string
}

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  following_type: 'user' | 'venue' | 'organizer'
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export type EventAttendance = {
  id: string
  user_id: string
  event_id: string
  status: 'going' | 'interested'
  created_at: string
}

export type DropTier = 'all' | 'neon' | 'gold' | 'diamond'

export type Drop = {
  id: string
  event_id: string | null
  venue_id: string | null
  original_price: number | null
  drop_price: number | null
  discount_percent: number | null
  currency: string | null
  quantity_available: number
  quantity_claimed: number
  starts_at: string
  expires_at: string
  min_tier_required: DropTier
  is_active: boolean
  created_at: string | null
}

export type DropClaim = {
  id: string
  drop_id: string
  user_id: string
  created_at: string | null
}

/** Drop joined with its event (+ venue) for the cards. */
export type DropWithEvent = Drop & {
  events: (Pick<Event, 'id' | 'title' | 'cover_image' | 'event_date' | 'start_time' | 'category' | 'city'>
    & { venues: Pick<Venue, 'name' | 'city'> | null }) | null
}

export type Crew = {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string | null
}

export type CrewMember = {
  id: string
  crew_id: string
  user_id: string
  role: string                       // 'owner' | 'member'
  joined_at: string | null
}

/** Crew member row joined with the member's profile (for avatars/names). */
export type CrewMemberWithProfile = CrewMember & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'> | null
}

export type Story = {
  id: string
  user_id: string
  media_url: string
  expires_at: string
  created_at: string
  views: string[]
}

// ─── Joined types ──────────────────────────────────────────────────────────────

export type EventWithVenue = Event & { venues: Venue | null }

/** Event sourced from an external provider (e.g. Ticketmaster), normalized to VYBZ shape. */
export type ExternalEvent = {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  city: string | null
  category: string
  event_date: string
  start_time: string | null
  price_min: number | null
  currency: string | null
  is_free: boolean
  venue_name: string | null
  venue_address: string | null
  url: string
  source: 'ticketmaster' | 'eventbrite'
}

export type TicketWithDetails = Ticket & {
  events: (Event & { venues: Pick<Venue, 'name' | 'city' | 'address'> | null }) | null
  ticket_types: Pick<TicketType, 'name' | 'price' | 'currency'> | null
}
