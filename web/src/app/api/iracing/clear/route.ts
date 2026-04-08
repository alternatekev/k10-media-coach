import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

/**
 * POST /api/iracing/clear — Delete ALL race sessions for the current user.
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
    const deleted = await db.delete(schema.raceSessions)
      .where(eq(schema.raceSessions.userId, userId))
      .returning({ id: schema.raceSessions.id })

    // Also clear driver ratings so they get recreated on next import
    await db.delete(schema.driverRatings)
      .where(eq(schema.driverRatings.userId, userId))

    // Also clear rating history
    await db.delete(schema.ratingHistory)
      .where(eq(schema.ratingHistory.userId, userId))

    return NextResponse.json({
      success: true,
      deleted: deleted.length,
    })
  } catch (err: any) {
    console.error('[iracing/clear] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
