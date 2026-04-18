import { NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { asc } from 'drizzle-orm'

// GET /api/theme-sets — Public list of theme sets (for theme chooser)
export async function GET() {
  try {
    const sets = await db
      .select({
        slug: schema.themeSets.slug,
        name: schema.themeSets.name,
        sortOrder: schema.themeSets.sortOrder,
      })
      .from(schema.themeSets)
      .orderBy(asc(schema.themeSets.sortOrder))

    return NextResponse.json({ sets })
  } catch (error) {
    console.error('Failed to fetch theme sets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
