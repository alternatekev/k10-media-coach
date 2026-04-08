import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { consolidateUserTracks } from '@/lib/resolve-track'

/**
 * POST /api/iracing/consolidate-tracks
 *
 * Re-resolves every race session's trackName against the track_maps table.
 * Merges duplicates like "Autodromo Nazionale Monza" and "Monza" into
 * whichever name is actually stored in track_maps.
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

  try {
    const result = await consolidateUserTracks(users[0].id)
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('[consolidate-tracks] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
