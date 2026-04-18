import { auth } from '@/lib/auth'
import { db, schema } from '@/db'
import { eq, desc } from 'drizzle-orm'
import MomentsDrawer from '@/components/MomentsDrawer'
import type { SessionRecord, RatingRecord } from '@/lib/moments'
import type { BrandInfo } from '@/types/brand'

export default async function MomentsDrawerWrapper() {
  const session = await auth()
  if (!session?.user) return null

  const user_ext = session.user as Record<string, unknown>
  const discordId = user_ext.discordId as string
  if (!discordId) return null

  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.discordId, discordId)).limit(1)
    if (users.length === 0) return null
    const dbUser = users[0]

    // Fetch sessions
    const sessions = await db
      .select()
      .from(schema.raceSessions)
      .where(eq(schema.raceSessions.userId, dbUser.id))
      .orderBy(desc(schema.raceSessions.createdAt))

    // Fetch rating history
    const ratingHistory = await db
      .select()
      .from(schema.ratingHistory)
      .where(eq(schema.ratingHistory.userId, dbUser.id))
      .orderBy(desc(schema.ratingHistory.createdAt))

    // ── Build lookups for dashboard-style moment cards ──────────────────
    const trackMapLookup: Record<string, string> = {}
    const trackLogoLookup: Record<string, string> = {}
    const trackDisplayNameLookup: Record<string, string> = {}
    const brandLogoLookup: Record<string, BrandInfo> = {}

    // Track maps
    const maps = await db
      .select({
        trackName: schema.trackMaps.trackName,
        svgPath: schema.trackMaps.svgPath,
        logoSvg: schema.trackMaps.logoSvg,
        displayName: schema.trackMaps.displayName,
      })
      .from(schema.trackMaps)

    maps.forEach((m) => {
      const key = m.trackName.toLowerCase()
      trackMapLookup[key] = m.svgPath
      if (m.logoSvg) trackLogoLookup[key] = m.logoSvg
      if (m.displayName) trackDisplayNameLookup[key] = m.displayName
    })

    // Brand logos
    const uniqueCarModels = [...new Set(sessions.map((s) => s.carModel).filter(Boolean))]
    if (uniqueCarModels.length > 0) {
      const brands = await db
        .select({
          brandKey: schema.carLogos.brandKey,
          brandName: schema.carLogos.brandName,
          logoSvg: schema.carLogos.logoSvg,
          logoPng: schema.carLogos.logoPng,
          brandColorHex: schema.carLogos.brandColorHex,
        })
        .from(schema.carLogos)

      for (const carModel of uniqueCarModels) {
        if (!carModel) continue
        const ml = carModel.toLowerCase()
        for (const brand of brands) {
          const bk = brand.brandKey.toLowerCase()
          const bn = brand.brandName.toLowerCase()
          if (ml.includes(bk) || ml.includes(bn)) {
            brandLogoLookup[carModel] = {
              logoSvg: brand.logoSvg,
              logoPng: brand.logoPng,
              brandColorHex: brand.brandColorHex,
              manufacturerName: brand.brandName,
            }
            break
          }
        }
      }
    }

    // Type the sessions and ratingHistory for the client component
    const typedSessions: SessionRecord[] = sessions.map((s) => ({
      id: s.id,
      carModel: s.carModel,
      trackName: s.trackName || 'Unknown Track',
      finishPosition: s.finishPosition || undefined,
      incidentCount: s.incidentCount || 0,
      metadata: s.metadata ? (typeof s.metadata === 'string' ? JSON.parse(s.metadata) : s.metadata) as SessionRecord['metadata'] : undefined,
      createdAt: s.createdAt,
      gameName: s.gameName || 'iracing',
      sessionType: s.sessionType || 'race',
    }))

    const typedRatingHistory: RatingRecord[] = ratingHistory.map((r) => ({
      iRating: r.iRating,
      prevIRating: r.prevIRating ?? 0,
      prevLicense: r.prevLicense || undefined,
      license: r.license,
      createdAt: r.createdAt,
    }))

    return (
      <MomentsDrawer
        sessions={typedSessions}
        ratingHistory={typedRatingHistory}
        trackMapLookup={trackMapLookup}
        trackLogoLookup={trackLogoLookup}
        trackDisplayNameLookup={trackDisplayNameLookup}
        brandLogoLookup={brandLogoLookup}
      />
    )
  } catch {
    return null
  }
}
