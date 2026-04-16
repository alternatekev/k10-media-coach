import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq, desc } from 'drizzle-orm'

/**
 * GET /api/events/sync — SSE endpoint for sync completion notifications
 *
 * The web dashboard connects to this endpoint and receives push updates when
 * the iRacing import completes or new session behavior data arrives, so the
 * page can refresh its data without manual reload.
 *
 * Auth: NextAuth session (browser cookie)
 *
 * Events emitted:
 *   - sync:complete   { importStatus, lastImportAt, sessionCount }
 *   - behavior:new    { sessionId, trackName, carModel }
 *   - ping            {} (keepalive every 30s)
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const user_ext = session.user as Record<string, unknown>
  const discordId = user_ext.discordId as string
  if (!discordId) {
    return new Response('Missing Discord ID', { status: 401 })
  }

  // Find the DB user
  const users = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.discordId, discordId))
    .limit(1)

  if (users.length === 0) {
    return new Response('User not found', { status: 404 })
  }

  const userId = users[0].id

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      let closed = false

      const send = (event: string, data: Record<string, any>) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      // Poll for changes every 5 seconds (lightweight — checks timestamps only)
      let lastImportAt: string | null = null
      let lastBehaviorAt: string | null = null

      const poll = async () => {
        if (closed) return

        try {
          // Check import status
          const accounts = await db.select({
            importStatus: schema.iracingAccounts.importStatus,
            lastImportAt: schema.iracingAccounts.lastImportAt,
          })
            .from(schema.iracingAccounts)
            .where(eq(schema.iracingAccounts.userId, userId))
            .limit(1)

          if (accounts.length > 0) {
            const acc = accounts[0]
            const importTs = acc.lastImportAt?.toISOString() ?? null
            if (importTs && importTs !== lastImportAt) {
              lastImportAt = importTs

              // Get updated session count
              const sessionCount = await db.select({ id: schema.raceSessions.id })
                .from(schema.raceSessions)
                .where(eq(schema.raceSessions.userId, userId))

              send('sync:complete', {
                importStatus: acc.importStatus,
                lastImportAt: importTs,
                sessionCount: sessionCount.length,
              })
            }
          }

          // Check for new behavior data
          const latestBehavior = await db.select({
            sessionId: schema.sessionBehavior.sessionId,
            createdAt: schema.sessionBehavior.createdAt,
          })
            .from(schema.sessionBehavior)
            .where(eq(schema.sessionBehavior.userId, userId))
            .orderBy(desc(schema.sessionBehavior.createdAt))
            .limit(1)

          if (latestBehavior.length > 0) {
            const behaviorTs = latestBehavior[0].createdAt.toISOString()
            if (behaviorTs !== lastBehaviorAt) {
              lastBehaviorAt = behaviorTs

              // Get session details for the notification
              const sessions = await db.select({
                trackName: schema.raceSessions.trackName,
                carModel: schema.raceSessions.carModel,
              })
                .from(schema.raceSessions)
                .where(eq(schema.raceSessions.id, latestBehavior[0].sessionId))
                .limit(1)

              send('behavior:new', {
                sessionId: latestBehavior[0].sessionId,
                trackName: sessions[0]?.trackName ?? null,
                carModel: sessions[0]?.carModel ?? null,
              })
            }
          }
        } catch (err) {
          // Swallow polling errors — the stream stays open
          console.error('[SSE sync] poll error:', err)
        }
      }

      // Initial state capture (don't emit events for existing data)
      // Wrap in try/catch so intervals still start even if first poll fails
      poll().catch((err) => {
        console.warn('[SSE sync] initial poll failed:', err)
      }).finally(() => {
        // After initial poll (success or failure), start the interval
        const interval = setInterval(poll, 5000)

        // Keepalive ping every 30s
        const pingInterval = setInterval(() => {
          send('ping', {})
        }, 30000)

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          closed = true
          clearInterval(interval)
          clearInterval(pingInterval)
          controller.close()
        })
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
