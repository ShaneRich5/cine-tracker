# CineTracker build brief: Design H (Popcorn Matinee)

This is the handoff for building CineTracker in Claude Code cloud sessions. Paste or commit it into the repo as `docs/build-brief.md` so every session can read it. The chosen design's source files are in this project under `claude/design/` (H-Home, H-Movie, H-Prefs, H-Web). They are HTML mockups to match visually; do not copy their markup verbatim.

Design canvas (all directions; H is the chosen one): https://claude.ai/artifact/TJyw5RbsmFTGJobzCTxt2p

## What we're building (Stage 1)

A responsive web app (desktop and mobile from day one) that shows every showtime near me across AMC, Regal, Alamo Drafthouse and local/indie theaters in one place. It is mainly for personal use at first, then shared with friends for feedback. A simpler, more accessible web version comes later, after feedback.

In scope now:

- Home: "Playing tonight" with each movie's catchable showtimes, plus the watchlist.
- Movie page: theater cards sorted by the next showing you can still make, with that time shown large, later times as small tokens, A-List badges on AMC showings, and a note when a showing is hidden because only accessible seats are left.
- Preferences: theater-group toggles (AMC, Regal, Alamo, Other chains, Local & indie), showtime layout (By theater, Time of day, Timeline; only "By theater" needs to be built first), hide accessible-only showings, preferred formats. It is out of the way by default: a panel opened from the header on desktop, its own page on mobile (header icon, plus the "Theaters & filters" link on the movie page).
- Data pipeline: scheduled connectors that fetch showtimes into the database.

Later: Theaters page, community Screenings (Stage 2), seat-layout data, accounts, the accessible bare-bones version.

## Stack

- Next.js (App Router, TypeScript) deployed on Vercel.
- Tailwind CSS for styling. The H tokens live in the Tailwind theme (CSS variables via `@theme`), so the accent stays one variable. Signature pieces (sticker card, striped header, time token) are built as components with Tailwind classes, not one-off CSS.
- Supabase (Postgres) for theaters, movies, showtimes. Row-level security on from the start.
- Connectors are TypeScript scripts in the same repo, run by a GitHub Actions scheduled workflow every few hours (Vercel Hobby crons only run once a day). They write to Supabase with a service-role key stored as a GitHub secret.
- TMDB API for posters, runtime and a shared movie ID across chains.
- Preferences live in a cookie (`ct_prefs`, small JSON: theater groups, formats, hide-accessible-only, layout) so server components can read them with `cookies()` from `next/headers` and filter before rendering, with no flash of unfiltered showtimes. The Preferences page writes the cookie (a server action, or `document.cookie` on the client; SameSite=Lax, 1 year, no sensitive data). Because pages read cookies they render dynamically, which is fine here. Move preferences to Supabase with auth later.

Suggested layout:

```
/app                 Next.js routes (/, /movies/[id], /preferences)
/components          UI components (StickerCard, TimeToken, DayPicker, Switch, StripedHeader, TabBar, TopNav)
/lib                 data access, time logic, preference store
/connectors          one file per source: alamo.ts, amc.ts, regal.ts, plus shared normalize.ts
/supabase/migrations SQL migrations
/.github/workflows   fetch-showtimes.yml
/docs                build-brief.md, design files
```

## Design tokens (H · Popcorn Matinee)

Colors:

| Token       | Value     | Use                                                                                |
| ----------- | --------- | ---------------------------------------------------------------------------------- |
| `--bg`      | `#FFFBF0` | page background                                                                    |
| `--surface` | `#FFFFFF` | cards, tab bar                                                                     |
| `--ink`     | `#2A1A12` | text, borders, sticker shadow                                                      |
| `--muted`   | `#6B5A4E` | secondary text                                                                     |
| `--accent`  | `#D1301F` | brand red: wordmark, big next-showing times, selected day, active tab, switches on |
| `--butter`  | `#FFD447` | time tokens, selected nav pill, primary secondary-button fill                      |
| `--line`    | `#EFE3CC` | dashed dividers, switch off                                                        |
| `--line-2`  | `#E3D3B5` | dashed note dividers                                                               |

Alternate accents the canvas offered: `#2457C5` (blue), `#1E7F55` (green). Keep the accent as one CSS variable.

Type (Google Fonts):

- Display: Lilita One (wordmark, headings, big times, nav pills, tab labels).
- Body: Work Sans 400–700.
- Times: IBM Plex Mono 500–600 (time tokens, day numbers).

Signature elements:

- Sticker card: `border: 2px solid var(--ink); border-radius: 16px; background: #fff; box-shadow: 3px 3px 0 var(--ink)`.
- Striped header: `repeating-linear-gradient(90deg, var(--accent) 0 28px, #fff 28px 56px)` with a 3px ink bottom border; the wordmark sits in a white sticker label on top of the stripes.
- Time token: pill, butter fill, 1.5px ink border, Plex Mono 13px 600.
- Day picker: 2px ink border, 12px radius; selected = accent fill, white text, 2px 2px 0 ink shadow.
- Switch: 52×30, 2px ink border, accent when on, `--line` when off, white knob with ink border. Use `role="switch"` and `aria-checked`.

Accessibility rules to keep: real `<button>`/`<a>`/`<input>` elements, 44px minimum touch targets, white text only on `--accent` (contrast is fine at #D1301F, don't lighten it), format and A-List conveyed in text, not color alone.

## Responsive behavior

- Desktop (≥ 900px): striped header with the wordmark sticker and nav pills (Movies, Theaters, Screenings, Preferences). Main area is two columns: "Playing tonight" poster grid on the left (about 300px), movie detail on the right with the theater cards in a grid (`repeat(auto-fit, minmax(260px, 1fr))`). Preferences opens as a panel above the content.
- Mobile (< 900px): single column, bottom tab bar (Home, Movies, Theaters, Screenings), preferences icon in the header, Preferences is its own page.
- Match H-Web for desktop and H-Home / H-Movie / H-Prefs for mobile.

## Data model

```sql
create type theater_group as enum ('amc', 'regal', 'alamo', 'other_chain', 'local');

create table theaters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_key theater_group not null,
  source text not null,            -- 'amc', 'alamo', 'regal', 'veezi', ...
  source_id text not null,
  lat double precision, lng double precision,
  unique (source, source_id)
);

create table movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id int unique,
  title text not null,
  runtime_min int,
  rating text,
  poster_url text
);

create table showtimes (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references movies(id) on delete cascade,
  theater_id uuid references theaters(id) on delete cascade,
  starts_at timestamptz not null,
  format text not null default 'standard',   -- imax, dolby, 70mm, 35mm, 3d, rpx, standard
  alist_eligible boolean not null default false,
  accessible_only boolean,                   -- null = unknown (seat data comes later)
  ticket_url text,
  source text not null,
  fetched_at timestamptz not null default now(),
  unique (theater_id, movie_id, starts_at, format)
);
```

Each connector run upserts the upcoming window and deletes future showtimes from that source that no longer appear.

## Core logic

- "Next you can make": the first showtime per theater with `starts_at > now()` (later: plus a travel buffer per theater). Sort theater cards by that time; theaters with nothing left today drop to the bottom.
- Showtimes that already started are collapsed behind "Show N earlier showings".
- Theater-group filter and the accessible-only filter come from preferences and apply everywhere.
- Display times in America/New_York.

## Data sources

- AMC: official developer portal; catalog APIs (movies, showtimes, theatres) are available for non-commercial use after an application. Seating APIs are closed. Apply early.
- Alamo Drafthouse: no official API, but the site loads schedules from JSON feeds that hobby projects already use. Build this connector first since it needs no approval. Personal use only; it can break without warning.
- Regal: no public API; same approach as Alamo for personal use.
- Indie theaters: one connector per ticketing platform (Veezi, Eventive, etc.), not per theater.
- If the app goes beyond personal use, switch to a licensed feed (Gracenote, MovieGlu, International Showtimes).

## Cloud session plan

Before session 1: create a GitHub repo named `cine-tracker` (initialize it with a README so it has a default branch), add this brief as `docs/build-brief.md` plus the four `H-*.dc.html` files under `docs/design/` (GitHub's "Add file > Upload files" works), then start the cloud session on that repo. Cloud sessions clone an existing repo, so every later session starts from the latest merged `main`.

Each prompt below is meant to be pasted into a fresh cloud session. Each one should end with a PR.

**Session 1: Scaffold and design system**

> Read docs/build-brief.md and the mockups in docs/design/. Scaffold a Next.js App Router + TypeScript app with Tailwind CSS. Put the H design tokens in the Tailwind theme as CSS variables (`@theme`), load the three Google Fonts with `next/font`, and build the shared components (StripedHeader, StickerCard, TimeToken, DayPicker, Switch, TopNav, TabBar) with Tailwind classes. Use a custom `desktop` breakpoint at 900px. Build the Home, Movie and Preferences pages with mock data that matches the mockups. Preferences are stored in a `ct_prefs` cookie and read in server components via `cookies()`, so filters apply on the server render (apply the theater-group and hide-accessible-only filters to the mock data to prove it works). Add a CLAUDE.md summarizing the stack, folder layout and design rules. Open a PR with screenshots at 390px and 1280px.

**Session 2: Database**

> Read docs/build-brief.md. Add Supabase: migrations for the schema in the brief, RLS policies (public read, service-role write), a seed script with my theaters, and typed data-access functions in /lib. Replace the mock data on Home and Movie with database queries, including the "next you can make" sorting and the collapsed earlier showings. Open a PR.

**Session 3: First connector**

> Read docs/build-brief.md. Build /connectors/normalize.ts (shared types, format mapping, TMDB title matching) and /connectors/alamo.ts for my Alamo theaters. Add a CLI entry (`npm run fetch`) and a GitHub Actions workflow that runs it every 4 hours using SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and TMDB_API_KEY secrets. Include a dry-run mode that prints what would change. Open a PR.

**Session 4: AMC and Regal**

> Read docs/build-brief.md. Add /connectors/amc.ts using the AMC catalog API (key in AMC_API_KEY), marking A-List-eligible showtimes, and /connectors/regal.ts. Reuse normalize.ts. Add both to the scheduled workflow. Open a PR.

**Session 5: Filters and polish**

> Read docs/build-brief.md. Wire the `ct_prefs` cookie into every query (read on the server): theater groups, formats, and hide accessible-only. Add the "Theaters & filters" summary line on the movie page. Do an accessibility pass (keyboard, focus states, labels, contrast) and fix what you find. Open a PR.

**Session 6: Deploy**

> Read docs/build-brief.md. Set up the Vercel project and environment variables, add an error page and empty states (no showtimes, connector stale), and document deployment in the README. Open a PR.

## Open items

- List the 3–5 theaters to seed (and the ticketing platform any indies use).
- AMC catalog API application status.
- Final app name (cine-tracker is the working name).
