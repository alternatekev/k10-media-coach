# Pro Drive Local-First: Investigation, Pros/Cons & Implementation Plan

**Date:** 2026-04-17
**Author:** Kevin + Claude
**Status:** Draft / Investigation

---

## 1. What Exists Today (The Hosted Stack)

The current Pro Drive dashboard is a **Next.js 16 app deployed on Vercel** at `prodrive.racecor.io`, backed by:

| Component | Service | What It Does |
|-----------|---------|-------------|
| **Hosting** | Vercel Pro ($20/mo) | SSR, API routes, edge middleware |
| **Database** | Neon PostgreSQL (Free→Launch) | 15 tables: users, ratings, race sessions, lap telemetry, session behavior, design tokens, theme sets, theme overrides, token builds, track maps, car logos, iRacing accounts, plugin tokens, auth codes |
| **Blob Storage** | Vercel Blob | Built CSS token files served to overlay |
| **Auth** | Discord OAuth (NextAuth 5) | User identity + plugin PKCE token exchange |
| **CMS** | Strapi (optional) | Marketing content (news, team profiles) |
| **iRacing API** | iRacing OAuth2 | Data import, schedule fetching |

The Electron overlay (`racecor-overlay/`) is already a **thick local client** — it runs its own HTTP server on port 9090, stores settings/ratings/profiles as JSON files in `userData/`, and renders the HUD entirely from local `file://` assets. The web dashboard's main touchpoints with the overlay are:

1. **Plugin auth** — OAuth2 PKCE flow so the overlay can identify itself to the web backend
2. **Token/theme CSS delivery** — overlay fetches built CSS from Vercel Blob URLs via `/api/tokens/current`
3. **iRacing data sync** — overlay pushes session data to `/api/iracing/extension-sync`
4. **Dashboard BrowserWindow** — the overlay literally opens `https://prodrive.racecor.io` in an Electron BrowserWindow for the analytics dashboard

---

## 2. What "Going Local" Means

The goal: **the overlay becomes entirely self-contained**. No Vercel, no Neon, no cloud database. The overlay ships with its own embedded database and serves its own admin/analytics UI. The overlay IS the product — it just gains a browser-based control surface served from localhost.

### What Moves Local

| Currently Hosted | Local Replacement |
|-----------------|-------------------|
| Neon PostgreSQL (15 tables) | **SQLite via better-sqlite3** (single file in userData/) |
| Vercel Blob (CSS token files) | **Local filesystem** (built CSS written to userData/tokens/) |
| Next.js API routes (auth, admin, tokens, iRacing) | **Express/Fastify on the overlay's existing port 9090** (or a dedicated port) |
| Next.js dashboard pages (analytics, token editor, admin) | **Embedded SPA** — React app served from the overlay's local HTTP server |
| Discord OAuth (NextAuth) | **Simplified local auth** — single-user mode, no OAuth dance needed for yourself |
| Strapi CMS | **Dropped entirely** — marketing site is separate concern |
| Style Dictionary build pipeline | **Runs locally** in the Electron main process (it's just a Node library) |

### What Stays External (Can't Be Localized)

- **iRacing API** — still needs OAuth2 to fetch race data from iRacing's servers
- **Discord API** — if you want Discord avatar/identity for multi-user (optional)
- **GitHub releases** — electron-updater for auto-updates
- **Font CDNs** — TypeKit, Google Fonts (or bundle them)

---

## 3. Pros & Cons

### Pros

**Zero recurring infrastructure cost.** No Vercel ($20/mo), no Neon (free tier now, but $5+/mo at scale), no Blob storage fees. Your monthly bill goes to $0 for hosting. The only costs are domain registration and GitHub (both of which you already pay for other reasons).

**Zero per-user scaling cost.** Each user's data lives on their own machine. 10 users or 10,000 users — your infrastructure cost is the same: nothing. No database connection pooling limits, no bandwidth overages, no serverless function invocations to worry about.

**Faster everything.** SQLite queries against a local database are measured in microseconds, not the 50-200ms round-trips to Neon's serverless pooler. Theme builds happen instantly on the local machine. The dashboard loads from localhost, not over the internet. No cold starts, no edge latency.

**Works offline.** Sim racers often have flaky internet or game-dedicated networks. A fully local dashboard works at the track, on a dedicated gaming rig with no browser, anywhere. The only network dependency is the iRacing API for importing new data.

**Simpler architecture.** One codebase (the overlay) instead of two deployed artifacts. No Vercel deployment pipeline, no Neon migration coordination, no Blob token management. Drizzle can target SQLite just as well as Postgres.

**Data sovereignty.** Users own their telemetry data as a local SQLite file they can back up, query directly, or delete entirely. No GDPR/privacy concerns about storing user race data on your servers.

**No auth complexity for single-user.** The overlay already knows who the user is (it has their iRacing profile, Discord connection, etc.). A local dashboard doesn't need OAuth flows — it's your computer, you're the only user.

**Portable data.** A SQLite file can be copied between machines, shared with a coach, backed up to Dropbox, or analyzed with any SQLite tool (DB Browser, DBeaver, Datasette). Postgres on Neon is a black box by comparison.

### Cons

**You lose the SaaS path.** If you ever want to monetize Pro Drive as a hosted subscription ($10/mo for analytics, etc.), you'd need to rebuild the hosted infrastructure or maintain two deployment targets. This door closes — or at least gets much heavier to reopen.

**Multi-device sync disappears.** Currently a user can log in from any browser and see their dashboard. Going local means the data is on one machine. Syncing across a desktop and a laptop requires either manual SQLite file copying, a LAN sync protocol, or re-introducing a cloud layer (defeating the purpose).

**No community features.** Shared leaderboards, comparing your iRating curve against friends, community-contributed track maps that propagate automatically — all of these require a central server. You'd need to build a separate opt-in sync mechanism (or accept these features don't exist).

**Electron + native SQLite = build complexity.** `better-sqlite3` is a native Node addon that needs to be compiled for each platform (Windows x64, Windows ARM, macOS x64, macOS ARM). Electron Forge/Builder handles this via `electron-rebuild`, but it adds CI complexity and occasional breakage on Electron version bumps. The overlay currently has zero native addons.

**Migration effort is significant.** Porting 15 Drizzle Postgres tables to SQLite means rewriting UUID columns (SQLite has no native UUID type — use TEXT), removing Postgres-specific features (jsonb → json as TEXT), testing all queries. The dashboard React pages need to be extracted from the Next.js app and rebuilt as a standalone SPA (or you use something like Vite + React Router). API routes need to move from Next.js serverless functions to Express handlers in the Electron main process.

**Token editor loses its hosted preview.** The current token editor at `/drive/admin/styles` previews themes in the browser with live contrast checking. Locally, this still works, but you lose the ability to edit themes from a phone/tablet while racing — the editor is only accessible from the machine running the overlay.

**Update complexity increases.** With the hosted web app, pushing a fix to the dashboard is a `git push` to Vercel. With a local app, every change requires a new Electron release, and users need to update. Database schema migrations need to run locally on each user's machine during app startup — and they can't fail, or you've corrupted someone's local data.

**You become the SQLite DBA.** WAL mode, `PRAGMA journal_mode`, vacuum schedules, backup strategies, corruption recovery — these are now your problems for every user's machine, not Neon's managed Postgres.

---

## 4. Cost Breakdown

### Current Hosted Costs (You as Only User)

| Service | Tier | Monthly Cost | Notes |
|---------|------|-------------|-------|
| Vercel | Pro (1 seat) | **$20.00** | Includes 1TB bandwidth, 100K blob ops |
| Neon PostgreSQL | Free | **$0.00** | 0.5 GB storage, 100 CU-hours (sufficient for 1 user) |
| Vercel Blob | Included in Pro | **~$0.00** | Token CSS files are tiny (<100KB total) |
| Strapi | Cloud Free or self-hosted | **$0.00** | Optional, minimal content |
| Domain (racecor.io) | Annual | **~$1.50** | Amortized monthly |
| **Total (1 user)** | | **~$21.50/mo** | **~$258/year** |

### Projected Hosted Costs (Growing User Base)

| Users | Vercel | Neon | Blob | Est. Total/mo |
|-------|--------|------|------|---------------|
| 1 | $20 | $0 (free) | $0 | **$20** |
| 10 | $20 | $5 (Launch, ~1GB) | $0.50 | **$25.50** |
| 50 | $20 | $5–10 (2–5GB, more CU) | $1 | **$26–31** |
| 100 | $20 | $10–20 (5–10GB) | $2 | **$32–42** |
| 500 | $20 | $30–60 (25–50GB, sustained compute) | $5 | **$55–85** |
| 1,000 | $20 | $60–120+ | $10+ | **$90–150+** |

Neon is the main scaling cost. Each user generates race sessions, lap telemetry, and behavioral data — roughly 50–200KB per race session. An active racer doing 5 sessions/week accumulates ~50MB/year of telemetry. At 500 users, that's 25GB of live data plus query compute.

### Local-First Costs

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Vercel | **$0** | No hosted app |
| Neon | **$0** | No cloud database |
| Blob | **$0** | CSS built and served locally |
| Domain | **$0** | Not needed (localhost) |
| GitHub (releases) | **$0** | Already paid for |
| **Total** | **$0/mo** | Regardless of user count |

### Break-Even Analysis

At current usage (just you): going local saves **~$258/year**.

The real savings come at scale. At 100 users you'd save $384–504/year. At 500 users, $660–1,020/year. At 1,000 users, $1,080–1,800/year. But these savings come at the cost of losing the ability to charge those users a subscription fee. A $5/mo subscription with 100 paying users would generate $6,000/year against $384–504 in hosting costs — a 12–15x return. **The local-first approach saves money but forecloses revenue.**

---

## 5. Implementation Plan

### Phase 1: Embedded Database (2–3 weeks)

**Goal:** Replace Neon PostgreSQL with local SQLite. The overlay gains persistent structured data.

1. **Add better-sqlite3 to the overlay** — install, configure `electron-rebuild`, verify builds on Windows + macOS CI
2. **Port the Drizzle schema to SQLite dialect** — create `racecor-overlay/src/db/schema.ts` mirroring the 15 Postgres tables with SQLite-compatible types (UUID→TEXT, JSONB→TEXT, TIMESTAMP→TEXT ISO8601)
3. **Write a migration runner** — on app startup, check schema version in a `_migrations` table, run pending migrations sequentially. Must be crash-safe (wrap each migration in a transaction)
4. **Initialize SQLite with good defaults** — WAL mode, foreign keys on, busy timeout 5000ms, mmap enabled
5. **Database file location:** `{userData}/prodrive.sqlite3` — survives app updates, easy to back up
6. **Import existing data** — one-time migration endpoint: user authenticates with the hosted API, downloads their data as JSON, inserts into local SQLite

### Phase 2: Local API Server (1–2 weeks)

**Goal:** The overlay's existing HTTP server (port 9090) gains API routes equivalent to the Next.js backend.

1. **Extend remote-server.js** (or replace with Express/Fastify) to serve API routes:
   - `GET /api/tokens/current` → read from local `userData/tokens/` directory
   - `POST /api/admin/tokens` → write to SQLite `designTokens` table
   - `POST /api/admin/tokens/build` → run Style Dictionary locally, write CSS to disk
   - `GET /api/ratings`, `GET /api/sessions` → query local SQLite
   - `POST /api/iracing/sync` → write incoming telemetry to local SQLite
2. **Move the Style Dictionary pipeline** — `web/src/lib/tokens/build.ts` becomes a local module. Instead of uploading to Vercel Blob, it writes to `userData/tokens/{setSlug}/{platform}.css`
3. **iRacing data import** — keep the iRacing OAuth2 flow (it's an external API), but store results locally instead of POSTing to Vercel

### Phase 3: Embedded Dashboard SPA (3–4 weeks)

**Goal:** The analytics dashboard and token editor run as a locally-served React app instead of `prodrive.racecor.io`.

1. **Extract dashboard pages from Next.js** — the core components (`RaceCard`, `IRatingTimeline`, `DriverDNARadar`, `RaceCalendarHeatmap`, `RaceScatterGrid`, `TokenEditor`, `PreviewPanel`) are already React components. Lift them into a standalone Vite + React Router SPA
2. **New SPA project:** `racecor-overlay/dashboard-app/` — Vite build, output to `racecor-overlay/dashboard-dist/`
3. **The overlay serves the SPA** from its local HTTP server at `http://localhost:9090/dashboard/`
4. **The overlay's BrowserWindow** loads `http://localhost:9090/dashboard/` instead of `https://prodrive.racecor.io`
5. **Remove auth requirements** — local dashboard doesn't need Discord OAuth. The user is implicitly authenticated (it's their machine). Add a simple PIN/password lock if desired
6. **Preserve the remote tablet/phone access** — the LAN server already serves on 9090. The dashboard SPA is automatically accessible from `http://{local-ip}:9090/dashboard/` on any device on the same network

### Phase 4: Theme System Localization (1 week)

**Goal:** The full token editing and theme pipeline works locally.

1. **Bundle base design tokens** as a JSON seed file (export from current Neon DB)
2. **Bundle all 12 F1 theme sets** as JSON seed data
3. **Token editor writes to local SQLite** → triggers local Style Dictionary build → CSS written to disk → overlay hot-reloads the CSS
4. **Live preview** works the same way — the token editor SPA reads from the same localhost API

### Phase 5: Cleanup & Cutover (1 week)

1. **Remove Vercel deployment** — or keep the marketing site only (k10motorsports.racing) and drop the prodrive subdomain
2. **Remove Neon dependency** — or keep it as a read-only archive
3. **Update the installer** — the Inno Setup installer bundles the SQLite database seed and dashboard SPA
4. **Update electron-updater** — schema migrations run on app update
5. **Document the backup story** — `prodrive.sqlite3` can be copied to any backup location

### Estimated Total: 8–11 weeks

---

## 6. Recommended Technology Choices

| Decision | Recommendation | Why |
|----------|---------------|-----|
| Embedded DB | **better-sqlite3** | Fastest Node SQLite binding, synchronous API (simpler in Electron main process), WAL mode for concurrent reads |
| ORM | **Drizzle (SQLite dialect)** | Already using Drizzle for Postgres — minimal rewrite, same query builder API |
| Local HTTP server | **Fastify** | Already in the Node ecosystem, faster than Express, plugin system for clean route organization |
| Dashboard SPA | **Vite + React 19 + React Router** | Components already written in React, Vite builds fast, no SSR needed for local |
| Style Dictionary | **Same library, local execution** | Zero changes to token build logic, just change output from Blob upload to file write |
| Migration runner | **Custom (simple)** | Drizzle's migration kit can generate SQLite migrations from schema diffs |

---

## 7. Hybrid Option Worth Considering

If the SaaS door matters at all, consider a **local-first with optional cloud sync** architecture:

- The overlay runs entirely locally (SQLite, local API, embedded dashboard) — this is the default
- Users who want multi-device sync or community features can opt into a cloud account
- The cloud layer becomes a thin sync service (CRDTs or last-write-wins on per-table rows), not a full application backend
- This preserves the $0 default while allowing a $5–10/mo "Pro Sync" tier later

This is more complex to build (add 4–6 weeks for sync logic), but it's the architecture that keeps all doors open.

---

## 8. Recommendation

**Go local-first.** The math is clear for a single-developer passion project: you're paying $258/year to host an app that only you use, with infrastructure complexity (Vercel + Neon + Blob + Discord OAuth + Strapi) that far exceeds the needs of a locally-installed desktop application. The overlay is already 90% of the way there — it has local storage, a local HTTP server, and a local rendering pipeline. The database and dashboard are the missing 10%.

The SaaS revenue argument is real but speculative. If the product proves valuable enough that people would pay for it, you can always build the cloud sync layer on top of the local-first foundation. Going in the other direction (cloud-first to local-first) is much harder.

Build it local. Ship it free. If it takes off, add optional cloud sync later.
