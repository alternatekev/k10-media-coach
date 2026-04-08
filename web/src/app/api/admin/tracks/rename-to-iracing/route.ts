import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { IRACING_OFFICIAL_NAMES } from '@/data/iracing-track-map'

/**
 * POST /api/admin/tracks/rename-to-iracing
 *
 * Overwrites track_maps.trackName with iRacing's official name for every track
 * that has a known mapping. Preserves the old name as displayName if displayName
 * isn't already set. Also updates all race sessions that reference the old name.
 *
 * Returns:
 *  - renamed: tracks that were updated
 *  - ambiguous: tracks with no clear iRacing name (need manual review)
 *  - sessionsUpdated: race sessions whose trackName was changed
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  try {
    // Load all tracks
    const allTracks = await db.select().from(schema.trackMaps)

    const renamed: { trackId: string; oldName: string; newName: string }[] = []
    const ambiguous: { trackId: string; currentName: string; displayName: string | null }[] = []
    let sessionsUpdated = 0

    for (const track of allTracks) {
      const iracingName = IRACING_OFFICIAL_NAMES[track.trackId]

      if (!iracingName) {
        // No known iRacing name for this trackId
        ambiguous.push({
          trackId: track.trackId,
          currentName: track.trackName,
          displayName: track.displayName,
        })
        continue
      }

      if (track.trackName === iracingName) {
        // Already correct
        continue
      }

      const oldName = track.trackName

      // Preserve old name as displayName if not already set
      const updates: Record<string, unknown> = {
        trackName: iracingName,
        updatedAt: new Date(),
      }
      if (!track.displayName) {
        updates.displayName = oldName
      }

      await db.update(schema.trackMaps)
        .set(updates)
        .where(eq(schema.trackMaps.id, track.id))

      // Update all race sessions that used the old trackName
      const updatedSessions = await db.update(schema.raceSessions)
        .set({ trackName: iracingName })
        .where(eq(schema.raceSessions.trackName, oldName))
        .returning({ id: schema.raceSessions.id })

      sessionsUpdated += updatedSessions.length

      renamed.push({
        trackId: track.trackId,
        oldName,
        newName: iracingName,
      })
    }

    return NextResponse.json({
      success: true,
      renamed,
      ambiguous,
      sessionsUpdated,
    })
  } catch (err: any) {
    console.error('[rename-to-iracing] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
