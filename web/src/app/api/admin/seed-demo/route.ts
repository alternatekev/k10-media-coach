import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

/**
 * POST /api/admin/seed-demo
 *
 * One-click demo data loader. Accepts the full payload from the generator:
 * {
 *   uploadData: { recentRaces, careerSummary, ... },  // → /api/iracing/upload shape
 *   ratingHistory: [{ category, iRating, license, ... }]
 * }
 *
 * Steps:
 * 1. Ensure user exists in DB (auto-create from Discord session if missing)
 * 2. Clear existing race sessions, rating history, and driver ratings
 * 3. Import races + career summary via the same logic as /api/iracing/upload
 * 4. Insert rating history with proper license/SR progression
 * 5. Set driver ratings to final state per category
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user_ext = session.user as Record<string, unknown>
  const discordId = user_ext.discordId as string
  const discordUsername = (user_ext.discordUsername as string) || 'demo'
  const discordDisplayName = (user_ext.discordDisplayName as string) || discordUsername
  const discordAvatar = (user_ext.discordAvatar as string) || null

  if (!discordId) {
    return NextResponse.json({ error: 'No Discord ID in session' }, { status: 401 })
  }

  // ── 1. Ensure user row exists ──────────────────────────────────────────────
  let userRows = await db.select().from(schema.users)
    .where(eq(schema.users.discordId, discordId)).limit(1)

  if (userRows.length === 0) {
    await db.insert(schema.users).values({
      discordId,
      discordUsername,
      discordDisplayName,
      discordAvatar,
    })
    userRows = await db.select().from(schema.users)
      .where(eq(schema.users.discordId, discordId)).limit(1)
  }
  const userId = userRows[0].id

  try {
    const body = await request.json()
    const uploadData = body.uploadData as Record<string, unknown> | undefined
    const ratingEntries = body.ratingHistory as Array<{
      category: string
      iRating: number
      safetyRating: string
      license: string
      prevIRating?: number
      prevSafetyRating?: string
      prevLicense?: string
      sessionType?: string
      trackName?: string
      carModel?: string
      createdAt: string
    }>

    const results: Record<string, unknown> = { userId }

    // ── 2. Clear existing data ─────────────────────────────────────────────────
    const deletedSessions = await db.delete(schema.raceSessions)
      .where(eq(schema.raceSessions.userId, userId))
    const deletedHistory = await db.delete(schema.ratingHistory)
      .where(eq(schema.ratingHistory.userId, userId))
    const deletedRatings = await db.delete(schema.driverRatings)
      .where(eq(schema.driverRatings.userId, userId))

    results.cleared = {
      sessions: deletedSessions.rowCount,
      history: deletedHistory.rowCount,
      ratings: deletedRatings.rowCount,
    }

    // ── 3. Import races ────────────────────────────────────────────────────────
    if (uploadData) {
      const recentRaces = (uploadData.recentRaces || []) as any[]
      let sessionsImported = 0

      for (const race of recentRaces) {
        try {
          const subsessionId = String(race.subsession_id || '')
          if (!subsessionId) continue

          const category = detectCategory(race)

          await db.insert(schema.raceSessions).values({
            userId,
            carModel: race.car_name || 'Unknown',
            manufacturer: null,
            category,
            trackName: race.track?.track_name || 'Unknown',
            sessionType: (race.event_type_name as string) || category,
            finishPosition: race.finish_position ?? null,
            incidentCount: race.incidents ?? null,
            metadata: {
              source: 'demo_seed',
              subsessionId: Number(subsessionId),
              gameId: subsessionId,
              seriesName: race.series_name || '',
              seriesId: race.series_id ?? null,
              seasonName: race.season_name || '',
              seasonYear: race.season_year ?? null,
              seasonQuarter: race.season_quarter ?? null,
              licenseCategory: race.license_category || '',
              licenseCategoryId: race.license_category_id ?? null,
              eventType: race.event_type_name || '',
              officialSession: race.official_session ?? null,
              numDrivers: race.num_drivers ?? null,
              preRaceIRating: race.oldi_rating ?? 0,
              postRaceIRating: race.newi_rating ?? 0,
              actualIRatingDelta: (race.newi_rating ?? 0) - (race.oldi_rating ?? 0),
              preRaceSR: (race.old_sub_level ?? 0) / 100,
              postRaceSR: (race.new_sub_level ?? 0) / 100,
              startPosition: race.starting_position ?? 0,
              finishPositionInClass: race.finish_position_in_class ?? null,
              completedLaps: race.laps_complete ?? 0,
              lapsLed: race.laps_led ?? 0,
              champPoints: race.champ_points ?? 0,
              strengthOfField: race.event_strength_of_field ?? 0,
              startedAt: race.session_start_time || null,
              carId: race.car_id ?? null,
              carClassId: race.car_class_id ?? null,
              carClassName: race.car_class_name || '',
              bestLapTime: race.best_lap_time ?? null,
              averageLapTime: race.average_lap ?? null,
              iracingTrackId: race.track?.track_id ?? null,
              trackConfig: race.track?.config_name || '',
            },
            createdAt: race.session_start_time
              ? new Date(race.session_start_time)
              : new Date(),
          })
          sessionsImported++
        } catch (err: unknown) {
          // Skip errors (duplicates etc)
        }
      }

      results.sessionsImported = sessionsImported
    }

    // ── 4. Insert rating history ───────────────────────────────────────────────
    if (Array.isArray(ratingEntries) && ratingEntries.length > 0) {
      let inserted = 0
      for (const entry of ratingEntries) {
        try {
          await db.insert(schema.ratingHistory).values({
            userId,
            category: entry.category,
            iRating: entry.iRating,
            safetyRating: entry.safetyRating || '0.00',
            license: entry.license || 'R',
            prevIRating: entry.prevIRating ?? null,
            prevSafetyRating: entry.prevSafetyRating ?? null,
            prevLicense: entry.prevLicense ?? null,
            sessionType: entry.sessionType ?? null,
            trackName: entry.trackName ?? null,
            carModel: entry.carModel ?? null,
            createdAt: new Date(entry.createdAt),
          })
          inserted++
        } catch {
          // skip
        }
      }
      results.ratingHistoryInserted = inserted
    }

    // ── 5. Set final driver ratings per category ───────────────────────────────
    if (Array.isArray(ratingEntries) && ratingEntries.length > 0) {
      const latestByCategory = new Map<string, typeof ratingEntries[0]>()
      for (const entry of ratingEntries) {
        const existing = latestByCategory.get(entry.category)
        if (!existing || new Date(entry.createdAt) > new Date(existing.createdAt)) {
          latestByCategory.set(entry.category, entry)
        }
      }

      let ratingsSet = 0
      for (const [category, latest] of latestByCategory) {
        await db.insert(schema.driverRatings).values({
          userId,
          category,
          iRating: latest.iRating,
          safetyRating: latest.safetyRating,
          license: latest.license,
        })
        ratingsSet++
      }
      results.driverRatingsSet = ratingsSet
      results.categories = [...latestByCategory.keys()]
    }

    // ── 6. Import career summary → careerSummary not stored separately,
    //       but we already set driverRatings from the ratingHistory above.
    //       The careerSummary in uploadData would normally also set driverRatings
    //       via the upload route, but we've already done it more accurately.

    return NextResponse.json({ success: true, ...results })
  } catch (err: unknown) {
    console.error('[seed-demo] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<number, string> = {
  1: 'oval', 2: 'road', 3: 'dirt_oval', 4: 'dirt_road', 5: 'road', 6: 'formula',
}

function detectCategory(race: Record<string, unknown>): string {
  const catId = race.license_category_id as number
  if (catId && CATEGORY_MAP[catId]) return CATEGORY_MAP[catId]

  const catStr = ((race.license_category || '') as string).toLowerCase()
  if (catStr === 'formula car') return 'formula'
  if (catStr === 'sports car') return 'road'
  if (catStr === 'dirt oval') return 'dirt_oval'
  if (catStr === 'dirt road') return 'dirt_road'
  if (catStr === 'oval') return 'oval'
  if (catStr === 'road') return 'road'

  return 'road'
}
