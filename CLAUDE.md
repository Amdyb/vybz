# VYBZ – Claude Code Master Instructions

## WHO I AM
- Name: Amdy Boubacar (TonTon Amdy / AmdyLabs)
- Based in Portland, USA with roots in Dakar, Senegal
- I am NOT a coder — I give directions, you execute everything
- Languages: French, Wolof, English

## WHAT IS VYBZ
VYBZ is a global nightlife and events discovery platform.
- Domain: vybz.city
- GitHub: github.com/Amdyb/vybz
- Tagline: C'est quoi les VYBZ ce soir ? / What are VYBZ tonight?
- City subtitle changes dynamically based on user location
- Starting city: Dakar, Senegal
- Target: West Africa + diaspora + global

## TECH STACK
- Framework: Next.js 15, App Router, TypeScript
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL + RLS + Storage)
- Auth: Supabase Auth
- Icons: Lucide React ONLY — no emojis ever
- Hosting: Vercel (auto-deploys from GitHub main)
- Payments: PayDunya (organizer subscriptions only)
- WhatsApp: Twilio Business API
- Maps: Google Maps Platform
- Places: Google Places API

## SUPABASE
- Project URL: https://qxcpaxpttyzlqscwgigv.supabase.co
- Tables: profiles, venues, events, ticket_types, orders, tickets, favorites, reviews

## REVENUE MODEL
VYBZ never handles user-to-organizer payments.

1. ORGANIZER SUBSCRIPTIONS via PayDunya (VYBZ income)
   - Basic: free — list events only, no ticket sales
   - Pro: paid monthly — sell tickets, organizer page, analytics
   - Premium: paid monthly — everything + featured + VYBZ Drops + priority

2. AFFILIATE COMMISSIONS (passive income)
   - Ticketmaster affiliate
   - Eventbrite affiliate
   - Shotgun affiliate
   - Fever affiliate
   - Google Places referrals

3. SPONSORED PLACEMENTS
   - Featured on home page
   - Top of map results
   - City spotlight

## ORGANIZER PAYMENT SETUP
Each organizer sets up their OWN payment system:
- Wave (Senegal/West Africa)
- Orange Money (West Africa)
- PayPal (global)
- Stripe or credit card processor (global)
- Cash on arrival option
VYBZ only provides the platform — never touches ticket money.

## QR CODE TICKETING
- User buys ticket through organizer payment system
- VYBZ generates unique QR code
- QR sent via WhatsApp + stored in My Tickets
- Single-use QR — cannot be reused
- Organizer scans QR at door via VYBZ scanner
- Duplicate scan shows alert with previous scan time

## ORGANIZER/ARTIST PAGES
- Dedicated page: vybz.city/organizer/[slug]
- Custom logo + banner
- Bio and social links
- All their events listed
- Feels like their own mini-website
- Shareable URL
- Verified badge for trusted organizers

## LOCATION SYSTEM
- Auto-detect city on first open
- VYBZ + city name updates dynamically
- Works globally: Dakar, Paris, Abidjan, Detroit, New York
- Manual city change option
- Diaspora Mode: see events in your home city from anywhere

## EVENT SOURCES LIVE
All external sources normalize to the VYBZ event shape (`ExternalEvent` in
`src/lib/types.ts`): id, title, description, cover_image, city, category, event_date,
start_time, price_min, currency, is_free, venue_name, venue_address, url, source.
External cards open the provider URL in a new tab (VYBZ never handles their payments),
are labeled by source, and every external row/tab hides gracefully when a city has none.

- Internal VYBZ events via Supabase — live. Primary source (`events` + `venues`, RLS).
- Ticketmaster API — live. Key in `TICKETMASTER_API_KEY` env var.
  Route `/api/events/ticketmaster`. Home row "Concerts & Shows near you" + `/events` Externes tab.
- Eventbrite API — live. Key in `EVENTBRITE_API_KEY` env var.
  Route `/api/events/eventbrite`. Home row "Événements proches de vous" + `/events` Externes tab.
  (Eventbrite's public `/events/search/` is retired; code is ready and fails soft. Switch to
  org-based `/v3/organizations/{org_id}/events/` or an affiliate feed to surface real data.)

Category mapping (provider → VYBZ): Music → Concerts & Live Music · Arts/Film/Theatre →
Culture & Art · Sports/Fitness/Health → Wellness & Outdoor · Food & Drink → Food & Drinks ·
else → Experiences. New source = route `/api/events/<source>` (secrets via env, ~10 min cache,
fail soft to `{ events: [] }`), reuse `ExternalEventCard` + `ExternalEventsRow`, allow its
image host in `next.config.js`.

## EVENT SOURCES FUTURE
- Fever — no API yet. Monitor their developer program.
- Shotgun — no API yet. Monitor their developer program.
- Facebook Events API — apply for access (Meta app review, ~4–6 weeks approval). High priority for Dakar.
- Workaround for Fever and Shotgun (no API): organizers paste their event link, VYBZ shows the
  event card with a redirect button ("Tickets via Shotgun" / "Tickets via Fever"). User clicks
  through to buy; VYBZ earns affiliate traffic credit and never touches ticket money.

## SOCIAL FEATURES (VYBZ SOCIAL)
- Check-in at events
- Post photos and vibes from events
- Follow venues and organizers
- Crew system — create squads, plan nights together
- Crew leaderboard
- Reviews and ratings
- VYBZ Live — 30-second video clips from inside events
- The Morning After — rate event next day, earn points

## PULSE POINTS SYSTEM

### WAYS TO EARN POINTS

**Discovery**
- Open app daily: +2
- View event page: +1
- Save to favorites: +5
- Share an event: +10
- Follow an organizer: +5

**Social**
- Check in at event: +20
- Post a photo: +15
- Tag a friend: +10
- Leave a review: +12
- Rate a venue: +8
- Create a crew: +25
- Invite a crew member: +15

**Transactions**
- Buy a ticket: +30
- Make a reservation: +20
- Refer friend who signs up: +50
- Refer friend who buys a ticket: +100

**Loyalty Bonuses**
- Attend same venue 3 times: +30 bonus
- Attend 5 events in one month: +50 bonus
- Complete your profile: +20
- Complete onboarding: +15
- First ticket purchase ever: +50 bonus

**Special**
- Check in on your birthday: +100
- Attend a featured event: +25
- First check-in at any event: +30
- VYBZ Drops purchase: +40

### TIERS
- Neon: 0–499 points
- Gold: 500–1999 points
- Diamond: 2000+ points

### MILESTONES AND REWARDS
- 100 pts — VYBZ Member badge
- 250 pts — 10% discount on next ticket
- 500 pts (Neon) — free drink voucher at partner venue
- 750 pts — early access to VYBZ Drops
- 1 000 pts — 1 free event entry of choice
- 1 500 pts — VIP upgrade on next ticket
- 2 000 pts (Gold) — 2 free tickets per month
- 3 000 pts — personal VYBZ concierge
- 5 000 pts (Diamond) — monthly VIP access + backstage passes

## UNIQUE FEATURES
1. Vibe Meter — real-time crowd energy from check-ins (Dead/Warming Up/Lit/On Fire)
2. Surprise Me — one tap finds best event near you right now
3. Diaspora Mode — buy tickets for home city events from anywhere
4. VYBZ Drops — flash ticket deals for Gold/Diamond users only
5. Artist/DJ Booking — organizers book talent directly in app
6. VYBZ Radio — ambient playlist matching nearby event vibe
7. The Comeback — post-event loyalty rewards from venues
8. Crew Leaderboard — most active squad wins monthly perks

## DESIGN RULES — NEVER BREAK THESE
- Background: #08080F (near black)
- Primary gradient: fuchsia-400 to cyan-400
- Card background: zinc-900
- Border: purple-900/30
- Text primary: white
- Text muted: zinc-400
- Price color: amber-400
- Free events: cyan-400
- NO emojis anywhere in the UI
- Lucide React icons only
- Mobile-first always
- DM Sans font for body
- Syne font for headings
- Dark mode only for now
- Colors are locked — do not change them

## LOGO
- Logo file: /public/vybz-logo.webp
- Always use image, never text for the logo
- Navbar: logo on left, nav links on right
- Navbar background: black #000000

## FOOTER
- Always include: Powered by AMDY LABS
- Style: text-xs, centered, gradient text from blue-400 to cyan-400

## LANGUAGES
- UI language: French primary
- Auto-detect device language (French or English)
- French tagline: C'est quoi les VYBZ ce soir ?
- English tagline: What are VYBZ tonight?

## PAGES BUILT
- / Home — Netflix swipe layout, 6 category rows, personalization, stories
- /events — all events plus Externes tab with Ticketmaster and Eventbrite
- /events/[id] — event detail with Going and Interested buttons
- /venues — all venues
- /venues/[id] — venue detail with follow and checkin
- /organizer/[slug] — organizer mini website
- /profile — full profile with Pulse Points, tabs, followers
- /profile/edit — edit profile avatar, bio, username
- /profile/pulse-points — full points breakdown
- /user/[username] — public profiles
- /messages — conversation list
- /messages/[id] — chat with realtime
- /map — Google Maps with venues and events
- /tickets — my tickets with QR codes
- /enterprise — dashboard
- /enterprise/create-event — create event form
- /enterprise/scanner — QR scanner
- /enterprise/analytics — analytics with charts
- /feed — activity feed
- /legal/terms — terms of service
- /legal/privacy — privacy policy
- /legal/cookies — cookie policy with banner
- /legal/organizer-terms — organizer terms
- /help — help center with FAQ

## STILL TO BUILD
- Account type selection at signup — User vs Organizer
- Separate onboarding for organizers
- VYBZ Drops flash deals page
- Surprise Me feature
- Crew system page
- Diaspora Mode toggle
- PayDunya organizer subscriptions
- Reward ticket redemption flow
- Organizer reward setup in dashboard
- Mobile responsive audit
- Logo redesign
- Facebook Events API when approved

## ENV VARIABLES NEEDED
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_GOOGLE_MAPS_KEY
- TICKETMASTER_API_KEY
- EVENTBRITE_API_KEY

## BUILD RULES
1. Always work in ~/vybz directory
2. Never break what already works
3. Build one feature at a time
4. Test locally before pushing
5. Always commit with clear messages
6. Push to GitHub after every working feature
7. Vercel auto-deploys on push
8. Mobile-first always
9. No emojis ever
10. Lucide React icons only
