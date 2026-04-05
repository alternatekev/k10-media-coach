'use client'

import { useState } from 'react'

// ── Component registry ─────────────────────────────────────────────

type Platform = 'web' | 'overlay'
type Category = 'admin' | 'dashboard' | 'shared' | 'driving' | 'race-info' | 'pit-strategy' | 'commentary' | 'visualization' | 'marketing'

interface ComponentEntry {
  name: string
  element?: string        // web component tag name (overlay only)
  file: string
  platform: Platform
  category: Category
  description: string
  props?: string[]        // key props/attributes
  tokens?: string[]       // design tokens consumed
}

const components: ComponentEntry[] = [
  // ── Web: Admin ──
  {
    name: 'AdminNav',
    file: 'web/src/app/drive/admin/AdminNav.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Tab navigation bar for admin section with active route highlighting. Left-aligned data pages, right-aligned tool pages.',
    props: [],
    tokens: ['--k10-red', '--text-muted', '--text-dim'],
  },
  {
    name: 'OverviewCards',
    file: 'web/src/app/drive/admin/OverviewCards.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Admin dashboard overview with 4 summary cards. Shows hero artwork from commentary photos, small multiples (SVG tracks, logo circles, user avatars, log success bars). Fetches from 5 API endpoints concurrently.',
    props: [],
    tokens: ['--k10-red', '--bg-surface', '--border', '--text-muted', '--green'],
  },
  {
    name: 'SearchFilterBar',
    file: 'web/src/app/drive/admin/components.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Reusable search input with game filter dropdown and sort options. Used across Track Maps and Car Brands pages.',
    props: ['search', 'onSearchChange', 'game', 'onGameChange', 'sort', 'onSortChange', 'sortOptions'],
    tokens: ['--bg-panel', '--border', '--text', '--text-muted'],
  },
  {
    name: 'GameBadge',
    file: 'web/src/app/drive/admin/components.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Colored pill badge showing game name (iRacing, LMU, ACC) with semi-transparent tinted background.',
    props: ['game'],
    tokens: ['--blue', '--amber', '--green'],
  },
  {
    name: 'StatCard',
    file: 'web/src/app/drive/admin/components.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Small stat display with label and value. Supports optional color for positive/negative/neutral states.',
    props: ['label', 'value', 'color?'],
    tokens: ['--bg-panel', '--border-subtle', '--text-dim'],
  },
  {
    name: 'TrackCard',
    file: 'web/src/app/drive/admin/tracks/TracksSection.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Track management card with SVG preview, editable display name, sector count toggle (3 ↔ 7), game badges, and delete action.',
    props: ['track', 'onUpdate', 'onDelete'],
    tokens: ['--bg-surface', '--border', '--k10-red', '--text'],
  },
  {
    name: 'LogoCard',
    file: 'web/src/app/drive/admin/brands/BrandsSection.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Brand logo card with SVG/PNG preview, color picker, game badges, opacity-tinted background using brand hex color (8C alpha), and clear-logo action.',
    props: ['logo', 'onUpdate', 'onClear'],
    tokens: ['--bg-surface', '--border', '--text'],
  },
  {
    name: 'MissingLogoCard',
    file: 'web/src/app/drive/admin/brands/BrandsSection.tsx',
    platform: 'web',
    category: 'admin',
    description: 'Empty-state brand card for brands without uploaded logos. Shows brand name over color background with per-card file upload.',
    props: ['brand', 'onUpload'],
    tokens: ['--bg-panel', '--border-subtle', '--text-muted'],
  },

  // ── Web: Dashboard ──
  {
    name: 'IRatingSparkline',
    file: 'web/src/app/drive/dashboard/IRatingSparkline.tsx',
    platform: 'web',
    category: 'dashboard',
    description: 'Tiny SVG sparkline chart showing iRating trend over recent sessions. Color-coded: green (uptrend), red (downtrend), gray (flat).',
    props: ['values: number[]'],
    tokens: ['--green', '--k10-red', '--text-muted'],
  },
  {
    name: 'RaceCard',
    file: 'web/src/app/drive/dashboard/RaceCard.tsx',
    platform: 'web',
    category: 'dashboard',
    description: 'Session history card showing track photo background, SVG track outline, car model, position badge (P1–P3 gold/silver/bronze, DNF red), best lap time, incidents, and iRating sparkline.',
    props: ['session', 'trackSvgPath', 'carImageUrl', 'trackImageUrl', 'iRatingHistory'],
    tokens: ['--bg-surface', '--border', '--k10-red', '--green', '--amber', '--text'],
  },
  {
    name: 'LogoCustomizer',
    file: 'web/src/app/drive/dashboard/LogoCustomizer.tsx',
    platform: 'web',
    category: 'dashboard',
    description: 'User-facing logo URL editor for custom overlay branding. Live preview, HTTPS validation, reset to default. Authenticates via bearer token.',
    props: ['customLogoUrl', 'userToken'],
    tokens: ['--bg-surface', '--border', '--green', '--k10-red'],
  },

  // ── Web: Shared / Marketing ──
  {
    name: 'FeatureShowcase',
    file: 'web/src/components/telemetry/FeatureShowcase.tsx',
    platform: 'web',
    category: 'marketing',
    description: 'Auto-cycling feature carousel showing 13 overlay modules with screenshots and descriptions. 8-second cycle with manual selection. Used on product landing page.',
    props: [],
    tokens: ['--k10-red', '--bg-surface', '--border'],
  },
  {
    name: 'TelemetryStatus',
    file: 'web/src/components/telemetry/TelemetryStatus.tsx',
    platform: 'web',
    category: 'shared',
    description: 'Live telemetry connection status panel. Shows connection indicator, latency, track/car info, and grid of real-time values (gear, speed, RPM, position, lap, throttle, brake).',
    props: [],
    tokens: ['--green', '--k10-red', '--amber', '--text', '--bg-surface'],
  },
  {
    name: 'TelemetryProvider',
    file: 'web/src/components/telemetry/TelemetryProvider.tsx',
    platform: 'web',
    category: 'shared',
    description: 'React context provider for live telemetry data. Polls /api/telemetry endpoint. Exposes useTelemetry() and useTelemetryValue() hooks with connection status and latency.',
    props: ['children'],
    tokens: [],
  },
  {
    name: 'ChannelBanner',
    file: 'web/src/components/youtube/ChannelBanner.tsx',
    platform: 'web',
    category: 'marketing',
    description: 'YouTube channel header with thumbnail, title, subscriber/video/view counts, and subscribe button link.',
    props: ['channel: YouTubeChannelInfo'],
    tokens: ['--bg-surface', '--border', '--k10-red'],
  },
  {
    name: 'VideoGrid',
    file: 'web/src/components/youtube/VideoGrid.tsx',
    platform: 'web',
    category: 'marketing',
    description: 'Responsive video grid with type filtering (Videos/Shorts/Live). Cards show thumbnail, title, duration, view count, publish date. Shorts use 9:16 aspect ratio.',
    props: ['videos: YouTubeVideo[]', 'title?'],
    tokens: ['--bg-surface', '--border', '--text-muted'],
  },

  // ── Overlay: Driving ──
  {
    name: 'Tachometer',
    element: 'racecor-tachometer',
    file: 'racecor-overlay/modules/components/tachometer.js',
    platform: 'overlay',
    category: 'driving',
    description: 'RPM gauge with segmented color bar (green/yellow/red zones), large gear display, and speed readout. Flashes at 91%+ RPM (redline).',
    props: ['rpmRatio', 'gear', 'speed', 'speedUnit', 'rpmValue'],
    tokens: ['--red', '--green', '--amber', '--ff', '--fs-xl', '--bg'],
  },
  {
    name: 'DriveHUD',
    element: 'racecor-drive-hud',
    file: 'racecor-overlay/modules/components/drive-hud.js',
    platform: 'overlay',
    category: 'driving',
    description: 'Full-screen driving display with 3-column layout: track map with player/opponent dots (left), position/lap delta/sector times (center), incident counter (right). Supports 3 or 7 sector configurations.',
    props: ['position', 'lapDelta', 'sectors', 'lastLap', 'bestLap', 'incidents', 'trackMapSvg'],
    tokens: ['--red', '--green', '--amber', '--purple', '--cyan', '--ff-mono', '--bg-panel'],
  },
  {
    name: 'PedalCurves',
    element: 'racecor-pedal-curves',
    file: 'racecor-overlay/modules/components/pedal-curves.js',
    platform: 'overlay',
    category: 'driving',
    description: 'Canvas-based pedal input visualization with throttle, brake, clutch curves. Histogram overlay shows input distribution. Response curve display.',
    props: ['throttle', 'brake', 'clutch', 'showCurves'],
    tokens: ['--green', '--red', '--blue', '--bg-panel'],
  },
  {
    name: 'Datastream',
    element: 'racecor-datastream',
    file: 'racecor-overlay/modules/components/datastream.js',
    platform: 'overlay',
    category: 'driving',
    description: 'Telemetry readout panel with G-force diamond indicator, yaw rate waveform, steering torque, track temperature, and lap delta.',
    props: ['lateralG', 'longitudinalG', 'yawRate', 'steeringTorque', 'trackTemp'],
    tokens: ['--cyan', '--amber', '--ff-mono', '--bg-panel', '--border'],
  },

  // ── Overlay: Race Info ──
  {
    name: 'Leaderboard',
    element: 'racecor-leaderboard',
    file: 'racecor-overlay/modules/components/leaderboard.js',
    platform: 'overlay',
    category: 'race-info',
    description: 'Full standings table with driver names, positions, gaps, iRating, and Canvas-rendered sparkline history showing lap time trends.',
    props: ['drivers', 'playerName', 'focusMode', 'maxRows'],
    tokens: ['--text-primary', '--text-secondary', '--ff', '--ff-mono', '--bg', '--border'],
  },
  {
    name: 'PositionCard',
    element: 'racecor-position-card',
    file: 'racecor-overlay/modules/components/position-card.js',
    platform: 'overlay',
    category: 'race-info',
    description: 'Current position display (P1, P2, etc.) with iRating and Safety Rating. Cycles pages showing different rating categories.',
    props: ['position', 'totalCars', 'irating', 'safetyRating', 'licenseClass'],
    tokens: ['--fs-xl', '--fw-black', '--ff', '--bg-panel'],
  },
  {
    name: 'GapDisplay',
    element: 'racecor-gap-display',
    file: 'racecor-overlay/modules/components/gap-display.js',
    platform: 'overlay',
    category: 'race-info',
    description: 'Time gap to car ahead/behind with driver names and iRating numbers. Color-coded gap changes (green shrinking, red growing).',
    props: ['aheadGap', 'aheadDriver', 'aheadIR', 'behindGap', 'behindDriver', 'behindIR'],
    tokens: ['--green', '--red', '--ff-mono', '--text-dim'],
  },
  {
    name: 'Incidents',
    element: 'racecor-incidents',
    file: 'racecor-overlay/modules/components/incidents.js',
    platform: 'overlay',
    category: 'race-info',
    description: 'Incident counter with penalty threshold and disqualification threshold indicators. Flashes on new incidents.',
    props: ['count', 'penaltyThreshold', 'dqThreshold'],
    tokens: ['--red', '--amber', '--ff-mono', '--bg-panel'],
  },

  // ── Overlay: Pit & Strategy ──
  {
    name: 'Pitbox',
    element: 'racecor-pitbox',
    file: 'racecor-overlay/modules/components/pitbox.js',
    platform: 'overlay',
    category: 'pit-strategy',
    description: 'Tabbed pit strategy panel with Fuel, Tires, and Strategy tabs. Shows fuel consumption rate, tire wear/selection grid, and pit window timing.',
    props: ['fuelData', 'tireData', 'strategyData', 'activeTab'],
    tokens: ['--green', '--amber', '--red', '--ff-mono', '--bg-panel', '--border'],
  },
  {
    name: 'FuelGauge',
    element: 'racecor-fuel-gauge',
    file: 'racecor-overlay/modules/components/fuel-gauge.js',
    platform: 'overlay',
    category: 'pit-strategy',
    description: 'Fuel level display with consumption rate per lap and estimated laps remaining. Color transitions from green to amber to red as fuel drops.',
    props: ['fuelLevel', 'fuelPerLap', 'fuelLapsRemaining'],
    tokens: ['--green', '--amber', '--red', '--ff-mono'],
  },
  {
    name: 'TireGrid',
    element: 'racecor-tire-grid',
    file: 'racecor-overlay/modules/components/tire-grid.js',
    platform: 'overlay',
    category: 'pit-strategy',
    description: '2×2 tire grid showing temperature, wear percentage, and compound indicator for each wheel position (FL, FR, RL, RR).',
    props: ['tires'],
    tokens: ['--green', '--amber', '--red', '--bg-panel', '--border'],
  },

  // ── Overlay: Commentary & Status ──
  {
    name: 'Commentary',
    element: 'racecor-commentary',
    file: 'racecor-overlay/modules/components/commentary.js',
    platform: 'overlay',
    category: 'commentary',
    description: 'AI commentary text panel with dynamic sentiment coloring (hue-based background and border). Auto-shows on new messages with slide-in animation.',
    props: ['title', 'text', 'meta', 'topicId', 'sentimentHue', 'visible'],
    tokens: ['--sentiment-h', '--sentiment-s', '--sentiment-l', '--ff', '--bg-panel'],
  },
  {
    name: 'CommentaryViz',
    element: 'racecor-commentary-viz',
    file: 'racecor-overlay/modules/components/commentary-viz.js',
    platform: 'overlay',
    category: 'commentary',
    description: 'Enhanced commentary with Canvas-based telemetry visualization charts and backdrop track image. Shows data context alongside AI-generated text.',
    props: ['title', 'text', 'meta', 'topicId', 'sentimentHue', 'visible', 'trackImage'],
    tokens: ['--sentiment-h', '--ff', '--ff-mono', '--bg-panel'],
  },
  {
    name: 'RaceControl',
    element: 'racecor-race-control',
    file: 'racecor-overlay/modules/components/race-control.js',
    platform: 'overlay',
    category: 'commentary',
    description: 'Full-width flag announcement banner (yellow, red, checkered, black, meatball) with animated stripe pattern and auto-dismiss timer.',
    props: ['flagState', 'detail'],
    tokens: ['--ff', '--fw-bold'],
  },
  {
    name: 'RaceEnd',
    element: 'racecor-race-end',
    file: 'racecor-overlay/modules/components/race-end.js',
    platform: 'overlay',
    category: 'race-info',
    description: 'Post-race results screen showing finishing position, best lap, incident count, and iRating/SR delta changes. Auto-hides after 30 seconds.',
    props: ['position', 'totalLaps', 'bestLap', 'incidents', 'iratingDelta', 'srDelta'],
    tokens: ['--green', '--red', '--ff', '--ff-mono', '--bg'],
  },

  // ── Overlay: Visualization ──
  {
    name: 'DriverProfile',
    element: 'racecor-driver-profile',
    file: 'racecor-overlay/modules/components/driver-profile.js',
    platform: 'overlay',
    category: 'visualization',
    description: 'Driver analytics panel with iRating/SR trend sparklines and session statistics (laps, incidents, best lap time).',
    props: ['driverName', 'licenseClass', 'irating', 'safetyRating', 'iratingHistory', 'srHistory'],
    tokens: ['--ff-display', '--ff-mono', '--bg-panel', '--border'],
  },
  {
    name: 'RaceTimeline',
    element: 'racecor-race-timeline',
    file: 'racecor-overlay/modules/components/race-timeline.js',
    platform: 'overlay',
    category: 'visualization',
    description: 'Position history heat-map strip showing driver position changes throughout the race with color-coded timeline visualization.',
    props: ['positionHistory'],
    tokens: ['--green', '--red', '--amber', '--bg-panel'],
  },
  {
    name: 'SectorHUD',
    element: 'racecor-sector-hud',
    file: 'racecor-overlay/modules/components/sector-hud.js',
    platform: 'overlay',
    category: 'driving',
    description: 'Sector time display with color coding: green (faster than best), amber (slower), red (much slower), purple (personal best).',
    props: ['sectors', 'bestSectors'],
    tokens: ['--green', '--amber', '--red', '--purple', '--ff-mono'],
  },
  {
    name: 'WebGL FX',
    element: 'racecor-webgl-fx',
    file: 'racecor-overlay/modules/components/webgl-fx.js',
    platform: 'overlay',
    category: 'visualization',
    description: 'WebGL2 effects engine providing glow, bloom, and ambient lighting post-processing. Renders to overlay canvas composited behind/over other elements.',
    props: ['mode', 'intensity'],
    tokens: ['--ambient-r', '--ambient-g', '--ambient-b', '--ambient-lum'],
  },
]

// ── Category metadata ──

const categoryMeta: Record<Category, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-red-500/20 text-red-400' },
  dashboard: { label: 'Dashboard', color: 'bg-blue-500/20 text-blue-400' },
  shared: { label: 'Shared', color: 'bg-green-500/20 text-green-400' },
  marketing: { label: 'Marketing', color: 'bg-amber-500/20 text-amber-400' },
  driving: { label: 'Driving', color: 'bg-cyan-500/20 text-cyan-400' },
  'race-info': { label: 'Race Info', color: 'bg-purple-500/20 text-purple-400' },
  'pit-strategy': { label: 'Pit & Strategy', color: 'bg-orange-500/20 text-orange-400' },
  commentary: { label: 'Commentary', color: 'bg-pink-500/20 text-pink-400' },
  visualization: { label: 'Visualization', color: 'bg-indigo-500/20 text-indigo-400' },
}

// ── Render ──

function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
      platform === 'web' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
    }`}>
      {platform === 'web' ? 'React' : 'Web Component'}
    </span>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  const meta = categoryMeta[category]
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${meta.color}`}>
      {meta.label}
    </span>
  )
}

function ComponentCard({ entry }: { entry: ComponentEntry }) {
  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] hover:border-[var(--border-accent)] transition-colors p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-[var(--text)]">{entry.name}</h3>
          {entry.element && (
            <code className="text-[10px] text-[var(--text-muted)] font-mono">&lt;{entry.element}&gt;</code>
          )}
        </div>
        <div className="flex gap-1.5">
          <PlatformBadge platform={entry.platform} />
          <CategoryBadge category={entry.category} />
        </div>
      </div>

      <p className="text-xs text-[var(--text-dim)] mb-3 leading-relaxed">{entry.description}</p>

      <code className="block text-[10px] text-[var(--text-muted)] font-mono mb-3 truncate">{entry.file}</code>

      {entry.props && entry.props.length > 0 && (
        <div className="mb-2">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Props: </span>
          <span className="text-[10px] text-[var(--text-dim)] font-mono">
            {entry.props.join(', ')}
          </span>
        </div>
      )}

      {entry.tokens && entry.tokens.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {entry.tokens.map(t => (
            <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type Filter = 'all' | 'web' | 'overlay'

export default function ComponentCatalog() {
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const filtered = components.filter(c => {
    if (filter !== 'all' && c.platform !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.element && c.element.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Group by category
  const grouped = new Map<Category, ComponentEntry[]>()
  for (const c of filtered) {
    const list = grouped.get(c.category) || []
    list.push(c)
    grouped.set(c.category, list)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex gap-1 border-b border-[var(--border)]">
          {[
            { id: 'all' as Filter, label: 'All', count: components.length },
            { id: 'web' as Filter, label: 'Web', count: components.filter(c => c.platform === 'web').length },
            { id: 'overlay' as Filter, label: 'Overlay', count: components.filter(c => c.platform === 'overlay').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors border-b-2 -mb-[1px] ${
                filter === tab.id
                  ? 'text-[var(--text)] border-[var(--text)]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-dim)]'
              }`}
            >
              {tab.label} <span className="text-[10px] text-[var(--text-muted)] ml-1">{tab.count}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search components…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-md bg-[var(--bg-panel)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-accent)] w-64"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-8 text-xs text-[var(--text-muted)]">
        <span><strong className="text-[var(--text)]">{filtered.length}</strong> components</span>
        <span><strong className="text-blue-400">{filtered.filter(c => c.platform === 'web').length}</strong> React</span>
        <span><strong className="text-purple-400">{filtered.filter(c => c.platform === 'overlay').length}</strong> Web Components</span>
        <span><strong className="text-[var(--text-dim)]">{grouped.size}</strong> categories</span>
      </div>

      {/* Grouped cards */}
      {Array.from(grouped.entries()).map(([category, entries]) => (
        <section key={category} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CategoryBadge category={category} />
            <span className="text-xs text-[var(--text-muted)]">{entries.length} components</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map(entry => (
              <ComponentCard key={`${entry.name}-${entry.platform}`} entry={entry} />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] italic py-12 text-center">
          No components match your search.
        </p>
      )}
    </div>
  )
}
