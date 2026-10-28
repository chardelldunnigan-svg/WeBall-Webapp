# 🏀 WeBall

Find a run. Call next. Pickup basketball around Cleveland, organized.

React Native (Expo SDK 57) + Supabase (Postgres, PostGIS, Realtime, Auth).
Runs in the **web browser first**, with the same codebase ready for iOS and Android.

## What's built (phases 1–3 of the v1 plan)

Auth (email/password) with auto-created player profiles, a player card setup flow
(position, self-rated skill, bio), a Cleveland court map/list with search, game
creation at any court, nearby-game discovery on map and list, transactional
join/leave with a waitlist that auto-promotes, and a realtime per-game group chat
scoped to the roster. The ratings schema and skill-aggregation pipeline (Bayesian
average shrunk toward self-rating) are live in the database; the post-game rating
UI is the next thing to build. Leagues have schema but no UI yet.

Run cleanup: hosts can cancel a run, a run cancels itself when the last player
leaves, and a scheduled job (pg_cron, every 15 min) marks finished runs completed —
or cancelled if only the host ever joined. Nothing is deleted; cancelled runs just
drop off the Games list.

## Setup

### 1. Supabase (one time, ~5 minutes)

In your Supabase project's **SQL Editor**, run these three files in order:

1. `supabase/migrations/0001_schema.sql` — tables, triggers, RLS policies
2. `supabase/migrations/0002_functions.sql` — geo RPCs, join/leave, aggregation
3. `supabase/migrations/0003_run_cleanup.sql` — cancel runs, auto-cleanup job
4. `supabase/seed.sql` — 16 real Cleveland courts so the map isn't empty

Then two dashboard settings:

- **Authentication → Sign In / Up → Email**: for fast local dev, turn OFF
  "Confirm email" (or keep it on and confirm each test account).
- Optional: **Database → Extensions → enable `pg_cron`**, then run the
  `cron.schedule` snippet at the bottom of `0002_functions.sql` so finished
  games auto-complete every 15 minutes.

> Seed-court coordinates are street-address approximations. Spot-check pins
> before launch (Table Editor → courts).

### 2. App

```bash
cp .env.example .env   # paste your Project URL + anon key (Settings → API)
npm install
npm run web            # opens WeBall in your browser at http://localhost:8081
```

To build the deployable website: `npm run build:web` → drag the `web-build/` folder
onto Netlify. The script (`scripts/build-web.js`) flattens Expo's asset folders,
because Netlify's drag-and-drop deploy skips folders like `node_modules`, `@expo`
and `build` (which silently breaks every icon), and adds the single-page-app redirect.

Phones: `npx expo start`, then scan the QR with Expo Go.

### Notes & known edges

- **Maps**: one `PinMap` component (`src/components/pin-map*.tsx`). In the
  browser it uses Leaflet + OpenStreetMap (free, no API key); on phones it uses
  `react-native-maps` (Apple Maps / Google Maps). A standalone Android build
  needs a Google Maps API key in `app.json` (`android.config.googleMaps.apiKey`).
- **Web vs. phone code**: files ending in `.web.tsx` are used in the browser;
  the plain `.tsx` file is used on iOS/Android. The date/time picker and map are
  split this way. Popup messages go through `src/lib/notify.ts` because React
  Native's `Alert` does nothing on the web.
- **Location**: if permission is denied the app quietly falls back to downtown
  Cleveland (Public Square) as the search center.

## Project layout

```
src/
  app/                    expo-router routes
    (auth)/               welcome, sign-in, sign-up
    (tabs)/               games (map/list), courts, leagues, profile
    game/[id].tsx         detail, roster, join/leave, chat entry
    court/[id].tsx        detail, mini-map, upcoming runs
    chat/[id].tsx         realtime group chat
    create-game.tsx       modal: court/time/type/size
    profile-setup.tsx     player card (position, skill, bio)
  components/             ui primitives, game/court cards, map + date picker (web/native)
  lib/                    supabase client, typed API helpers, location hook, notify
  providers/              auth/session context
supabase/
  migrations/             0001 schema+RLS, 0002 functions+triggers
  seed.sql                Cleveland starter courts
```

## Where the security lives

Everything sensitive is enforced in Postgres, not the client: RLS on every
table; roster writes only through `join_game`/`leave_game` (row-locked, so two
players can't take the last spot); chat readable only by roster members;
ratings insertable only by players who shared a completed game, readable only
by their author; `computed_skill` writable only by the server-side trigger.

## Roadmap (from the v1 plan)

- Indoor/outdoor filters on Games and Courts; indoor venue details (access, cost, hours)
- Rented-gym runs with per-player cost splitting (Stripe)
4. Post-game rating UI (schema + aggregation already live)
5. 1:1 DMs (reuses conversations/messages) + user-submitted courts (`add_court` RPC is ready)
6. Leagues: recurring seasons, teams, standings
- Push notifications (Expo Notifications + a small Edge Function) — biggest
  retention lever, worth pulling forward.
