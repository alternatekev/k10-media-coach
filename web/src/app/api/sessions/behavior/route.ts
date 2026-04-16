import { NextRequest, NextResponse } from 'next/server'
import { validateToken } from '@/lib/plugin-auth'
import { db, schema } from '@/db'
import { eq, and } from 'drizzle-orm'

/**
 * POST /api/sessions/behavior — Receive per-session behavior data from the plugin
 *
 * The SimHub plugin sends behavioral metrics (rage score, incident details,
 * per-lap telemetry) at the end of each session. This data powers the SR
 * Optimizer, composure trends, and post-session debrief views.
 *
 * Auth: Bearer token (plugin auth)
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 })
  }

  const result = await validateToken(authHeader.slice(7))
  if (!result) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  const userId = result.user.id

  try {
    const body = await request.json()
    const { subsessionId, behavior, laps } = body

    if (!subsessionId) {
      return NextResponse.json({ error: 'Missing subsessionId' }, { status: 400 })
    }

    // Find the matching race session by subsessionId in metadata
    const sessions = await db.select()
      .from(schema.raceSessions)
      .where(eq(schema.raceSessions.userId, userId))
      .limit(500)

    const matchingSession = sessions.find(s => {
      const meta = s.metadata as Record<string, any> | null
      return meta?.subsessionId === subsessionId || meta?.gameId === String(subsessionId)
    })

    if (!matchingSession) {
      return NextResponse.json({ error: 'Session not found for subsessionId' }, { status: 404 })
    }

    const sessionId = matchingSession.id
    let behaviorInserted = false
    let lapsInserted = 0
    const errors: string[] = []

    // ── 1. Insert session behavior summary ──
    if (behavior && typeof behavior === 'object') {
      try {
        // Check for existing behavior record
        const existing = await db.select({ id: schema.sessionBehavior.id })
          .from(schema.sessionBehavior)
          .where(and(
            eq(schema.sessionBehavior.sessionId, sessionId),
            eq(schema.sessionBehavior.userId, userId),
          ))
          .limit(1)

        if (existing.length === 0) {
          await db.insert(schema.sessionBehavior).values({
            sessionId,
            userId,
            hardBrakingEvents: behavior.hardBrakingEvents ?? 0,
            closePassCount: behavior.closePassCount ?? 0,
            tailgatingSeconds: behavior.tailgatingSeconds ?? 0,
            offTrackCount: behavior.offTrackCount ?? 0,
            spinCount: behavior.spinCount ?? 0,
            cleanLaps: behavior.cleanLaps ?? 0,
            totalLaps: behavior.totalLaps ?? 0,
            peakRageScore: behavior.peakRageScore ?? null,
            avgRageScore: behavior.avgRageScore ?? null,
            rageSpikes: behavior.rageSpikes ?? 0,
            cooldownsTriggered: behavior.cooldownsTriggered ?? 0,
            retaliationAttempts: behavior.retaliationAttempts ?? 0,
            totalRageRecoverySeconds: behavior.totalRageRecoverySeconds ?? 0,
            rageRecoveryCount: behavior.rageRecoveryCount ?? 0,
            incidentsByPhase: behavior.incidentsByPhase ?? null,
            incidentLocations: behavior.incidentLocations ?? null,
            threatLedger: behavior.threatLedger ?? null,
            commentaryLog: behavior.commentaryLog ?? null,
          })
          behaviorInserted = true
        }
      } catch (err: any) {
        errors.push(`Behavior insert: ${err.message}`)
      }
    }

    // ── 2. Insert per-lap telemetry ──
    if (Array.isArray(laps) && laps.length > 0) {
      // Check for existing laps
      const existingLaps = await db.select({ id: schema.lapTelemetry.id })
        .from(schema.lapTelemetry)
        .where(and(
          eq(schema.lapTelemetry.sessionId, sessionId),
          eq(schema.lapTelemetry.userId, userId),
        ))
        .limit(1)

      if (existingLaps.length === 0) {
        try {
          const lapRows = laps.map((lap: any) => ({
            sessionId,
            userId,
            lapNumber: lap.lapNumber,
            lapTime: lap.lapTime ?? null,
            sector1: lap.sector1 ?? null,
            sector2: lap.sector2 ?? null,
            sector3: lap.sector3 ?? null,
            incidentCount: lap.incidentCount ?? 0,
            incidentPoints: lap.incidentPoints ?? 0,
            isCleanLap: lap.isCleanLap ?? (lap.incidentCount === 0),
            incidentTrackPosition: lap.incidentTrackPosition ?? null,
            rageScore: lap.rageScore ?? null,
            throttleAggression: lap.throttleAggression ?? null,
            steeringErraticism: lap.steeringErraticism ?? null,
            brakingAggression: lap.brakingAggression ?? null,
            proximityChasing: lap.proximityChasing ?? null,
            metadata: lap.metadata ?? null,
          }))

          // Batch insert in chunks of 50
          for (let i = 0; i < lapRows.length; i += 50) {
            const chunk = lapRows.slice(i, i + 50)
            await db.insert(schema.lapTelemetry).values(chunk)
            lapsInserted += chunk.length
          }
        } catch (err: any) {
          errors.push(`Lap insert: ${err.message}`)
        }
      }
    }

    // Report as ok:true only if we successfully processed at least one data type,
    // or if there was nothing to insert. Partial failures are tracked in errors array.
    const hasPartialFailure = errors.length > 0 && (behaviorInserted || lapsInserted > 0)
    return NextResponse.json({
      ok: errors.length === 0 || (!behaviorInserted && lapsInserted === 0),
      sessionId,
      behaviorInserted,
      lapsInserted,
      partialFailure: hasPartialFailure,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    console.error('[behavior] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
