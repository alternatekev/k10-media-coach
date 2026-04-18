import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import SafetyDashboard from './SafetyDashboard'

export const metadata = {
  title: 'Safety Rating Optimizer - RaceCor.io Pro Drive',
  description: 'Improve your iRacing Safety Rating with data-driven insights',
}

export default async function SafetyPage() {
  const session = await auth()
  if (!session?.user) redirect('/drive')

  const user_ext = session.user as Record<string, unknown>
  const discordId = user_ext.discordId as string
  if (!discordId) redirect('/drive')

  // Fetch user from database
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.discordId, discordId))
    .limit(1)
  if (users.length === 0) redirect('/drive')
  const dbUser = users[0]

  // Fetch current ratings by category
  const currentRatings = await db
    .select()
    .from(schema.driverRatings)
    .where(eq(schema.driverRatings.userId, dbUser.id))

  // Fetch recent race sessions (last 50)
  const raceSessions = await db
    .select()
    .from(schema.raceSessions)
    .where(eq(schema.raceSessions.userId, dbUser.id))
    .orderBy(desc(schema.raceSessions.createdAt))
    .limit(50)

  // Fetch recent rating history (last 100)
  const ratingHistory = await db
    .select()
    .from(schema.ratingHistory)
    .where(eq(schema.ratingHistory.userId, dbUser.id))
    .orderBy(desc(schema.ratingHistory.createdAt))
    .limit(100)

  // Fetch lap telemetry for clean streak calculation
  const lapTelemetry = await db
    .select()
    .from(schema.lapTelemetry)
    .where(eq(schema.lapTelemetry.userId, dbUser.id))
    .orderBy(desc(schema.lapTelemetry.createdAt))
    .limit(500)

  // Fetch session behavior data for phase analysis
  const sessionBehaviors = await db
    .select()
    .from(schema.sessionBehavior)
    .where(eq(schema.sessionBehavior.userId, dbUser.id))
    .orderBy(desc(schema.sessionBehavior.createdAt))
    .limit(100)

  // Process data for transmission to client component
  const processedRatings = currentRatings.map((r) => ({
    category: r.category,
    iRating: r.iRating,
    safetyRating: r.safetyRating,
    license: r.license,
  }))

  const processedSessions = raceSessions.map((s) => ({
    id: s.id,
    carModel: s.carModel,
    manufacturer: s.manufacturer,
    category: s.category,
    trackName: s.trackName || 'Unknown',
    sessionType: s.sessionType,
    finishPosition: s.finishPosition,
    incidentCount: s.incidentCount || 0,
    createdAt: s.createdAt.toISOString(),
    metadata: s.metadata
      ? typeof s.metadata === 'string'
        ? JSON.parse(s.metadata)
        : s.metadata
      : null,
  }))

  const processedHistory = ratingHistory
    // Time trials report bogus license data (level 1) — exclude them
    .filter((r) => {
      const st = (r.sessionType || '').toLowerCase()
      return !(st.includes('time trial') || st.includes('time_trial') || st.includes('timetrial') || st.includes('lone qual'))
    })
    .map((r) => ({
      category: r.category,
      iRating: r.iRating,
      safetyRating: r.safetyRating,
      license: r.license,
      prevSafetyRating: r.prevSafetyRating,
      prevIRating: r.prevIRating,
      trackName: r.trackName,
      carModel: r.carModel,
      sessionType: r.sessionType,
      createdAt: r.createdAt.toISOString(),
    }))

  const processedLapTelemetry = lapTelemetry.map((l) => ({
    id: l.id,
    sessionId: l.sessionId,
    lapNumber: l.lapNumber,
    isCleanLap: l.isCleanLap,
    incidentCount: l.incidentCount || 0,
    createdAt: l.createdAt.toISOString(),
  }))

  const processedBehaviors = sessionBehaviors.map((b) => ({
    sessionId: b.sessionId,
    cleanLaps: b.cleanLaps,
    totalLaps: b.totalLaps,
    incidentsByPhase: b.incidentsByPhase
      ? typeof b.incidentsByPhase === 'string'
        ? JSON.parse(b.incidentsByPhase)
        : b.incidentsByPhase
      : null,
    incidentLocations: b.incidentLocations
      ? typeof b.incidentLocations === 'string'
        ? JSON.parse(b.incidentLocations)
        : b.incidentLocations
      : null,
  }))

  return (
    <SafetyDashboard
      currentRatings={processedRatings}
      raceSessions={processedSessions}
      ratingHistory={processedHistory}
      lapTelemetry={processedLapTelemetry}
      sessionBehaviors={processedBehaviors}
    />
  )
}
