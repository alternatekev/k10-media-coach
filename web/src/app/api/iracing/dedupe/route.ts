import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq, sql } from 'drizzle-orm'

/**
 * POST /api/iracing/dedupe — Remove duplicate race sessions
 *
 * Groups races by subsession_id (from metadata.gameId).
 * When duplicates exist, keeps the one with the most metadata fields populated
 * and deletes the rest.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const user_ext = session.user as Record<string, unknown>
  const discordId = user_ext.discordId as string
  if (!discordId) {
    return NextResponse.json({ error: 'No Discord ID in session' }, { status: 401 })
  }

  const users = await db.select().from(schema.users)
    .where(eq(schema.users.discordId, discordId)).limit(1)
  if (users.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const userId = users[0].id

  try {
    // Fetch all race sessions for this user
    const allSessions = await db.select().from(schema.raceSessions)
      .where(eq(schema.raceSessions.userId, userId))

    // Group by subsession_id (metadata.gameId)
    const byGameId = new Map<string, typeof allSessions>()
    const noGameId: typeof allSessions = []

    for (const s of allSessions) {
      const meta = s.metadata as Record<string, unknown> | null
      const gameId = meta?.gameId || meta?.subsessionId
      if (gameId) {
        const key = String(gameId)
        if (!byGameId.has(key)) byGameId.set(key, [])
        byGameId.get(key)!.push(s)
      } else {
        noGameId.push(s)
      }
    }

    let duplicatesRemoved = 0
    const idsToDelete: string[] = []

    for (const [gameId, sessions] of byGameId) {
      if (sessions.length <= 1) continue

      // Score each session: prefer iracing_upload source, more metadata fields, more recent
      const scored = sessions.map(s => {
        const meta = s.metadata as Record<string, unknown> | null
        let score = 0

        // Prefer iracing_upload source over other sources
        if (meta?.source === 'iracing_upload') score += 100

        // Count non-null, non-zero, non-empty metadata fields
        if (meta) {
          for (const [k, v] of Object.entries(meta)) {
            if (v !== null && v !== undefined && v !== 0 && v !== '' && v !== false) {
              score += 1
            }
          }
        }

        // Prefer sessions with more populated top-level fields
        if (s.trackName && s.trackName !== 'Unknown') score += 5
        if (s.carModel && s.carModel !== 'Unknown') score += 5
        if (s.finishPosition !== null) score += 3
        if (s.incidentCount !== null) score += 3

        return { session: s, score }
      })

      // Sort by score descending — keep the best one
      scored.sort((a, b) => b.score - a.score)

      // Mark all but the best for deletion
      for (let i = 1; i < scored.length; i++) {
        idsToDelete.push(scored[i].session.id)
      }
      duplicatesRemoved += scored.length - 1
    }

    // Delete in batches
    if (idsToDelete.length > 0) {
      for (let i = 0; i < idsToDelete.length; i += 50) {
        const batch = idsToDelete.slice(i, i + 50)
        await db.delete(schema.raceSessions)
          .where(sql`${schema.raceSessions.id} IN (${sql.join(batch.map(id => sql`${id}`), sql`,`)})`)
      }
    }

    return NextResponse.json({
      success: true,
      totalSessions: allSessions.length,
      uniqueRaces: byGameId.size,
      duplicatesRemoved,
      sessionsWithoutGameId: noGameId.length,
      remaining: allSessions.length - duplicatesRemoved,
    })
  } catch (err: any) {
    console.error('[iracing/dedupe] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
