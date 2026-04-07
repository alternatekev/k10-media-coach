/**
 * POST /api/admin/tracks/shtl
 *
 * Upload a SimHub .shtl file and port it directly into the track maps database.
 * Accepts multipart/form-data with a single "file" field containing the .shtl binary.
 *
 * The endpoint:
 *   1. Decompresses the gzip payload and parses the JSON
 *   2. Extracts WorldX/WorldZ/LapDistPct points → CSV
 *   3. Runs the CSV through the same csvToSvg() normalization pipeline as the standard upload
 *   4. Inserts (or replaces) the track map row, including sector boundaries from the .shtl metadata
 *
 * Response (201 created / 200 replaced):
 *   { success, status, trackId, pointCount, mapId? }
 *
 * Errors:
 *   400 — no file, wrong content-type, decompression/parse failure, insufficient points
 *   403 — not an admin
 */

export const runtime = 'nodejs'  // required for zlib (gunzipSync)

import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin'
import { csvToSvg, generateSvgPreview } from '@/lib/track-svg'
import { parseShtlBuffer } from '@/lib/parse-shtl'

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── 1. Read the uploaded file ──────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a "file" field' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing "file" field in form data' }, { status: 400 })
  }

  const filename = (file as File).name ?? 'upload.shtl'
  if (!filename.toLowerCase().endsWith('.shtl')) {
    return NextResponse.json(
      { error: 'File must have a .shtl extension' },
      { status: 400 }
    )
  }

  // ── 2. Parse .shtl → CSV + metadata ───────────────────────────────────────
  let parsed: Awaited<ReturnType<typeof parseShtlBuffer>>
  try {
    const arrayBuffer = await file.arrayBuffer()
    parsed = parseShtlBuffer(Buffer.from(arrayBuffer))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse .shtl file'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const {
    csv, trackId, trackName, trackConfig, displayName,
    trackLengthKm, gameName, sectorCount, sectorBoundariesJson, pointCount,
  } = parsed

  // ── 3. CSV → SVG (same normalization pipeline as the standard CSV upload) ──
  let svgResult: ReturnType<typeof csvToSvg>
  try {
    svgResult = csvToSvg(csv, displayName || trackName)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate SVG from track data'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { svgPath, svgPreview } = svgResult
  const normalizedTrackId = trackId.toLowerCase().trim()

  // Build display name: "Adelaide Street Circuit" style
  const resolvedDisplayName = displayName?.trim()
    || (trackConfig ? `${capitalize(trackName)} ${trackConfig}` : capitalize(trackName))

  // ── 4. Insert or replace track map ────────────────────────────────────────
  const existing = await db
    .select({ id: schema.trackMaps.id })
    .from(schema.trackMaps)
    .where(eq(schema.trackMaps.trackId, normalizedTrackId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(schema.trackMaps)
      .set({
        trackName:        trackName.trim(),
        displayName:      resolvedDisplayName,
        svgPath,
        pointCount,
        rawCsv:           csv.trim(),
        gameName:         gameName || 'iracing',
        trackLengthKm:    trackLengthKm ?? undefined,
        sectorCount,
        sectorBoundaries: sectorBoundariesJson,
        svgPreview,
        updatedAt:        new Date(),
      })
      .where(eq(schema.trackMaps.trackId, normalizedTrackId))

    return NextResponse.json({
      success:    true,
      status:     'replaced',
      trackId:    normalizedTrackId,
      pointCount,
    })
  }

  const result = await db
    .insert(schema.trackMaps)
    .values({
      trackId:          normalizedTrackId,
      trackName:        trackName.trim(),
      displayName:      resolvedDisplayName,
      svgPath,
      pointCount,
      rawCsv:           csv.trim(),
      gameName:         gameName || 'iracing',
      trackLengthKm:    trackLengthKm ?? undefined,
      sectorCount,
      sectorBoundaries: sectorBoundariesJson,
      svgPreview,
    })
    .returning({ id: schema.trackMaps.id })

  return NextResponse.json({
    success:    true,
    status:     'created',
    trackId:    normalizedTrackId,
    mapId:      result[0].id,
    pointCount,
  }, { status: 201 })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
