# Post-Session Debrief Page

A comprehensive session review interface for K10 Motorsports drivers to analyze behavior patterns, identify recurring issues, and track improvement over time.

## File Structure

- **page.tsx** — Server component. Handles auth, fetches sessions, telemetry, and behavior data from the database.
- **SessionSelector.tsx** — Client component. Dropdown/list of recent 20 sessions with track, car, date, finish position, and incident count. Uses URL params `?session=<id>` for persistence.
- **SessionSummaryCard.tsx** — Client component. Displays session stats: incidents, clean laps, SR/iR changes, race phase breakdown, and behavioral metrics.
- **LapTimeline.tsx** — Client component. Recharts dual-axis chart showing lap times (green area) and rage score (orange line). Red dots mark incident laps.
- **CommentaryReplay.tsx** — Client component. Chronological commentary log with severity badges (1-5) colored by severity level.
- **BehavioralRadar.tsx** — Client component. Recharts radar chart comparing session behavioral profile vs. all-time average across 4 dimensions: throttle aggression, steering erraticism, braking aggression, proximity chasing.
- **PatternDetection.tsx** — Client component. Cross-session analysis at the same track. Groups incidents by track position (±5% tolerance) and shows recurring problem areas with lap numbers.

## Data Flow

1. **Authentication**: Uses `auth()` from `@/lib/auth` to get Discord user, redirects if not authenticated.
2. **User Lookup**: Finds user in `schema.users` by `discordId`.
3. **Session Fetch**: Loads last 20 `raceSessions` for the user, defaults to most recent.
4. **URL Params**: `?session=<id>` parameter controls which session is displayed; defaults to most recent if missing.
5. **Related Data Fetch**:
   - `lapTelemetry` — per-lap behavioral metrics (lap time, rage score, aggression metrics, incidents)
   - `sessionBehavior` — session-level summaries (hard braking, close passes, tailgating, off-track, spins, clean laps, rage spikes, commentary log)
   - All sessions/behaviors for track (for pattern detection)
   - All user sessions/behaviors (for all-time behavioral average)

## Key Features

### 1. Session Selector
- Clickable list of last 20 sessions
- Shows track, car, date, finish position, incident count
- Highlights selected session with emerald ring
- Clicking a session updates URL param and re-renders page

### 2. Session Summary
- Track + car + date header
- 4-stat grid: incidents, clean lap %, SR change, iR change
- Race phase breakdown (early/mid/late incidents)
- Behavioral metrics grid (hard braking, close passes, spins, rage scores)

### 3. Lap Timeline
- Dual-axis chart (lap time left, rage score right)
- Green area under curve = lap consistency
- Orange line = composure (higher = more agitated)
- Red dots = incident markers on specific laps
- Hover tooltip shows detailed lap info

### 4. Commentary Replay
- Chronological list of commentary events from `sessionBehavior.commentaryLog`
- Each entry: lap number, topic, severity badge (1-5), text
- Severity colors: zinc (1), blue (2), amber (3), orange (4), rose (5)

### 5. Behavioral Radar
- 4-axis radar chart: throttle aggression, steering erraticism, braking aggression, proximity chasing
- Green fill = current session profile
- Dashed amber outline = all-time average (overlaid)
- Normalized to 0-100 scale
- Shows raw values in insights section (e.g., "throttle aggression: 8.5/25")

### 6. Pattern Detection
- Analyzes all sessions at the same track
- Groups incident locations by track position (±5% tolerance)
- Shows locations where incidents occurred 2+ times
- Lists lap numbers and count
- Provides coaching advice on focus areas
- Empty state if no patterns detected

## Empty States

- **No sessions**: Message "No sessions found. Race to populate debrief data."
- **No lap telemetry**: "No lap telemetry available for this session. Enable the plugin to capture detailed behavioral data."
- **No patterns**: "No recurring incident patterns detected at [Track]. Keep up the consistency!"
- **Insufficient behavioral data**: Components gracefully skip rendering if data is null/empty.

## Styling

- Dark theme using `bg-zinc-*` and `text-zinc-*` utilities
- Card layout with `rounded-lg bg-zinc-800 border border-zinc-700`
- Accent colors: emerald (positive), rose (negative), amber (warning), blue (notice)
- Uses Tailwind CSS 4 grid/flex system
- Responsive: `grid-cols-2 sm:grid-cols-4` for stat cards

## Database Tables Used

- `users` — Authentication and user metadata
- `raceSessions` — Aggregated session data (track, car, finish position, incidents, metadata with SR/iR)
- `lapTelemetry` — Per-lap behavioral metrics (lap time, rage score, aggression scores, incidents)
- `sessionBehavior` — Per-session behavioral summary (hard braking, close passes, off-track, spins, clean laps, rage metrics, phase breakdown, incident locations, commentary log)

## Notes

- The page is a **server component** by default (Next.js 16 app router). Client components are marked with `'use client'`.
- Session selector uses **URL params** for persistence (`?session=<id>`), so users can share/bookmark debrief links.
- All-time behavioral average is computed by averaging `lapTelemetry` rows across all user sessions (up to 1000).
- Pattern detection groups incident locations with 5% track position tolerance (rounding to nearest 0.05).
- Recharts charts are set to `isAnimationActive={false}` for performance.
- Commentary log is expected to be a JSONB array in the database with shape: `{ lap, topic, severity, sentiment?, text }`
