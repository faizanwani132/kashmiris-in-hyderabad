# Kashmiris of Hyderabad

Privacy-first mobile web app to help Kashmiris in Hyderabad discover nearby community members through approximate map pins.

## Stack

- React + Vite
- Tailwind CSS
- Leaflet + OpenStreetMap + marker clustering
- Supabase (public read + public insert, no auth flow)
- Lucide icons

## Features

- Full-screen Hyderabad map with clustered community markers
- Mobile marker tap opens bottom sheet; desktop marker tap opens map popup
- Floating `Add Me to the Map` action
- Consent-based submission form (no auth, no OTP, no email)
- Two location options:
  - Use current location (browser geolocation)
  - Choose manually on map with draggable pin/tap-to-drop
- Mandatory privacy blur: all coordinates rounded to 3 decimals before insert
- Radius discovery (`1km / 3km / 5km`) with optional auto-center
- One submission per device via `localStorage`
- Fixed legal/safety footer

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

3. Fill Supabase values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

4. Run development server:

```bash
npm run dev
```

## Supabase Setup

Run `supabase/schema.sql` in the Supabase SQL editor.

Table used: `community_members`

| column | type |
|---|---|
| id | uuid (pk) |
| name | text |
| area | text |
| origin | text (optional) |
| lat | float |
| lng | float |
| city | text |
| visible | boolean |
| created_at | timestamp |

Security rules applied in SQL:

- Public `select`
- Public `insert`
- No `update`/`delete` policies for anon/authenticated clients
- Insert policy enforces:
  - `city = 'Hyderabad'`
  - `lat` and `lng` must already be rounded to 3 decimals

## Anti-Spam Rule

The app stores `koh_submitted_at` in localStorage after successful insert.
That key disables further submissions from the same device/browser.

For local testing, clear it manually from devtools:

```js
localStorage.removeItem('koh_submitted_at')
```

## Build

```bash
npm run build
```

`netlify.toml`, `public/_redirects`, and `vercel.json` are included for SPA-friendly hosting.
