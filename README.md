# Kashmiris of Hyderabad

Privacy-first mobile web app to help Kashmiris in Hyderabad discover nearby community members through approximate map pins.

## Stack

- React + Vite
- Tailwind CSS
- Leaflet + OpenStreetMap + marker clustering
- Supabase (public read + RPC-based writes, no auth flow)
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
- Radius slider (`1km - 100km`) with optional auto-center
- New pins highlighted on the map for 10 minutes
- One submission per device via `localStorage`, with self-service edit/remove for the same device
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
| updated_at | timestamp |
| owner_token_hash | text (not selectable by anon) |

Security rules applied in SQL:

- Public `select`
- Direct table `insert`/`update`/`delete` revoked for anon/authenticated clients
- `insert_community_member`, `update_community_member`, and `delete_community_member` RPC functions for managed writes
- Owner token hash stored server-side to enable device-level edit/delete
- Coordinates are rounded to 3 decimals on insert/update

## Anti-Spam Rule

The app stores both `koh_submitted_at` and `koh_member_ownership_v1` in localStorage after successful insert.
These keys enable the same device/browser to edit or remove the submitted pin.

For local testing, clear it manually from devtools:

```js
localStorage.removeItem('koh_submitted_at')
localStorage.removeItem('koh_member_ownership_v1')
```

## Build

```bash
npm run build
```

`netlify.toml`, `public/_redirects`, and `vercel.json` are included for SPA-friendly hosting.
