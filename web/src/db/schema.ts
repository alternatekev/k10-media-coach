import { pgTable, text, timestamp, boolean, integer, doublePrecision, jsonb, uuid, varchar, unique } from 'drizzle-orm/pg-core'

// ── Users (Discord-authenticated members) ──
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  discordId: varchar('discord_id', { length: 32 }).notNull().unique(),
  discordUsername: varchar('discord_username', { length: 64 }).notNull(),
  discordDisplayName: varchar('discord_display_name', { length: 64 }),
  discordAvatar: text('discord_avatar'),
  email: varchar('email', { length: 255 }),
  customLogoUrl: text('custom_logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Plugin Tokens (OAuth2 tokens issued to the desktop plugin) ──
export const pluginTokens = pgTable('plugin_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: varchar('access_token', { length: 128 }).notNull().unique(),
  refreshToken: varchar('refresh_token', { length: 128 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').default(false).notNull(),
  deviceName: varchar('device_name', { length: 128 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Authorization Codes (short-lived codes for OAuth2 flow) ──
export const authCodes = pgTable('auth_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeChallenge: varchar('code_challenge', { length: 128 }),
  codeChallengeMethod: varchar('code_challenge_method', { length: 8 }),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── iRacing Accounts (linked iRacing profiles for data import) ──
export const iracingAccounts = pgTable('iracing_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  iracingCustId: integer('iracing_cust_id').notNull(),
  iracingDisplayName: varchar('iracing_display_name', { length: 128 }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  lastImportAt: timestamp('last_import_at'),
  importStatus: varchar('import_status', { length: 16 }).default('pending'), // pending, importing, complete, error
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Track Maps (community-contributed SVG track outlines) ──
export const trackMaps = pgTable('track_maps', {
  id: uuid('id').defaultRandom().primaryKey(),
  trackId: varchar('track_id', { length: 128 }).notNull().unique(),
  trackName: varchar('track_name', { length: 256 }).notNull(),
  displayName: varchar('display_name', { length: 256 }),
  svgPath: text('svg_path').notNull(),
  pointCount: integer('point_count').notNull(),
  rawCsv: text('raw_csv').notNull(),
  contributorId: uuid('contributor_id').references(() => users.id, { onDelete: 'set null' }),
  gameName: varchar('game_name', { length: 64 }).default('iracing'),
  trackLengthKm: doublePrecision('track_length_km'),
  sectorCount: integer('sector_count').default(3).notNull(),
  sectorBoundaries: text('sector_boundaries'),  // JSON array of boundary percentages e.g. "[0.14,0.28,0.43,0.57,0.71,0.86]"
  svgPreview: text('svg_preview'),
  logoSvg: text('logo_svg'),       // Track/venue logo SVG markup
  logoPng: text('logo_png'),       // Track/venue logo PNG (base64)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Car Logos (community-contributed manufacturer brand logos) ──
export const carLogos = pgTable('car_logos', {
  id: uuid('id').defaultRandom().primaryKey(),
  brandKey: varchar('brand_key', { length: 64 }).notNull().unique(), // 'ferrari', 'bmw', etc.
  brandName: varchar('brand_name', { length: 128 }).notNull(),       // 'Ferrari', 'BMW'
  logoSvg: text('logo_svg'),                                         // raw SVG markup
  logoPng: text('logo_png'),                                         // base64-encoded PNG
  brandColorHex: varchar('brand_color_hex', { length: 7 }),          // '#DC0000'
  contributorId: uuid('contributor_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Driver Ratings (iRacing performance data) ──
export const driverRatings = pgTable('driver_ratings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 16 }).notNull(), // road, oval, dirt_road, dirt_oval
  iRating: integer('irating').notNull().default(0),
  safetyRating: varchar('safety_rating', { length: 8 }).notNull().default('0.00'),
  license: varchar('license', { length: 4 }).notNull().default('R'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Rating History (historical snapshots after each race) ──
export const ratingHistory = pgTable('rating_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 16 }).notNull(),
  iRating: integer('irating').notNull(),
  safetyRating: varchar('safety_rating', { length: 8 }).notNull(),
  license: varchar('license', { length: 4 }).notNull(),
  prevIRating: integer('prev_irating'),
  prevSafetyRating: varchar('prev_safety_rating', { length: 8 }),
  prevLicense: varchar('prev_license', { length: 4 }),
  sessionType: varchar('session_type', { length: 32 }),
  trackName: varchar('track_name', { length: 128 }),
  carModel: varchar('car_model', { length: 128 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Race Sessions (aggregated car/session data) ──
export const raceSessions = pgTable('race_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  carModel: varchar('car_model', { length: 128 }).notNull(),
  manufacturer: varchar('manufacturer', { length: 64 }),
  category: varchar('category', { length: 16 }).notNull(),
  gameName: varchar('game_name', { length: 64 }).default('iracing'),
  trackName: varchar('track_name', { length: 128 }),
  sessionType: varchar('session_type', { length: 32 }),
  finishPosition: integer('finish_position'),
  incidentCount: integer('incident_count'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Lap Telemetry (per-lap granular data for SR/behavior analysis) ──
export const lapTelemetry = pgTable('lap_telemetry', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => raceSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lapNumber: integer('lap_number').notNull(),
  lapTime: doublePrecision('lap_time'),             // seconds
  sector1: doublePrecision('sector_1'),              // seconds
  sector2: doublePrecision('sector_2'),
  sector3: doublePrecision('sector_3'),
  incidentCount: integer('incident_count').default(0),
  incidentPoints: integer('incident_points').default(0),  // 1x, 2x, 4x accumulated
  isCleanLap: boolean('is_clean_lap').default(true),
  incidentTrackPosition: doublePrecision('incident_track_position'), // 0–1 where on track
  rageScore: doublePrecision('rage_score'),           // avg rage score during lap
  throttleAggression: doublePrecision('throttle_aggression'),   // 0–25
  steeringErraticism: doublePrecision('steering_erraticism'),   // 0–20
  brakingAggression: doublePrecision('braking_aggression'),     // 0–20
  proximityChasing: doublePrecision('proximity_chasing'),       // 0–25
  metadata: jsonb('metadata'),                        // additional per-lap data
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Session Behavior (per-session behavioral summary from IncidentCoachEngine) ──
export const sessionBehavior = pgTable('session_behavior', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => raceSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Aggression metrics
  hardBrakingEvents: integer('hard_braking_events').default(0),
  closePassCount: integer('close_pass_count').default(0),
  tailgatingSeconds: doublePrecision('tailgating_seconds').default(0),
  // Consistency
  offTrackCount: integer('off_track_count').default(0),
  spinCount: integer('spin_count').default(0),
  cleanLaps: integer('clean_laps').default(0),
  totalLaps: integer('total_laps').default(0),
  // Composure
  peakRageScore: doublePrecision('peak_rage_score'),
  avgRageScore: doublePrecision('avg_rage_score'),
  rageSpikes: integer('rage_spikes').default(0),
  cooldownsTriggered: integer('cooldowns_triggered').default(0),
  retaliationAttempts: integer('retaliation_attempts').default(0),
  totalRageRecoverySeconds: doublePrecision('total_rage_recovery_seconds').default(0),
  rageRecoveryCount: integer('rage_recovery_count').default(0),
  // Incident details (JSONB for flexible querying)
  incidentsByPhase: jsonb('incidents_by_phase'),       // { early: n, mid: n, late: n }
  incidentLocations: jsonb('incident_locations'),      // [{ trackPosition, lapNumber, type, points }]
  threatLedger: jsonb('threat_ledger'),                // serialized per-driver threat entries
  commentaryLog: jsonb('commentary_log'),              // [{ lap, topic, severity, sentiment, text }]
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Design Tokens (canonical source of truth for all design variables) ──
export const designTokens = pgTable('design_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  path: varchar('path', { length: 128 }).notNull().unique(),
  value: text('value').notNull(),
  kind: varchar('kind', { length: 16 }).notNull(),
  cssProperty: varchar('css_property', { length: 64 }).notNull(),
  description: text('description'),
  wcag: varchar('wcag', { length: 32 }),
  platforms: varchar('platforms', { length: 16 }).notNull().default('both'),
  category: varchar('category', { length: 32 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Theme Sets (named collections of dark+light overrides, e.g. F1 liveries) ──
export const themeSets = pgTable('theme_sets', {
  slug: varchar('slug', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  description: text('description'),
  liveryImage: text('livery_image'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── Theme Overrides (per-set dark/light overrides on top of base tokens) ──
export const themeOverrides = pgTable('theme_overrides', {
  id: uuid('id').defaultRandom().primaryKey(),
  setSlug: varchar('set_slug', { length: 32 }).notNull().default('default')
    .references(() => themeSets.slug, { onDelete: 'cascade' }),
  themeId: varchar('theme_id', { length: 32 }).notNull(),
  tokenPath: varchar('token_path', { length: 128 }).notNull()
    .references(() => designTokens.path),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueSetThemeToken: unique().on(table.setSlug, table.themeId, table.tokenPath),
}))

// ── Token Builds (tracks which built CSS files are currently live) ──
export const tokenBuilds = pgTable('token_builds', {
  id: uuid('id').defaultRandom().primaryKey(),
  setSlug: varchar('set_slug', { length: 32 }).notNull().default('default')
    .references(() => themeSets.slug, { onDelete: 'cascade' }),
  themeId: varchar('theme_id', { length: 32 }).notNull(),
  platform: varchar('platform', { length: 16 }).notNull(),
  blobUrl: text('blob_url').notNull(),
  hash: varchar('hash', { length: 16 }).notNull(),
  builtAt: timestamp('built_at').defaultNow().notNull(),
  builtBy: uuid('built_by').references(() => users.id),
})

