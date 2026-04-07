/**
 * parse-shtl.ts — SimHub .shtl → racecor CSV/metadata converter
 *
 * .shtl files are gzip-compressed JSON produced by SimHub's telemetry recorder.
 * They contain a sampled lap with world-relative 3D car positions + lap distance %.
 *
 * The CarCoordinates[].Value array is [x, y, z] where:
 *   - x = left/right world axis  → maps to WorldX in our CSV
 *   - y = elevation               → discarded (same as the C# dead-reckoning pipeline)
 *   - z = forward/back world axis → maps to WorldZ in our CSV
 *
 * Output CSV format: WorldX,WorldZ,LapDistPct  (compatible with csvToSvg() in track-svg.ts)
 */

import { gunzipSync } from 'zlib'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ShtlCoordPoint {
  Key: string           // timestamp e.g. "00:01:33.9010000"
  Value: [number, number, number]  // [x, y, z] world-relative coords
  CurrentSector: number
  p: number             // lap distance pct 0.0–1.0
}

export interface ShtlData {
  TrackDisplayName:   string
  TrackName:          string
  TrackConfig:        string
  ReportedTrackLength: number
  GameCode:           string
  GameReader:         string
  CarModel:           string
  CarId:              string
  HasRelativeCarCoordinates: boolean
  CarCoordinates:     ShtlCoordPoint[]
  SectorDefinitions:  Record<string, number>
  SectorDetails:      Array<{ SectorIndex: number; SectorTime: string; SectorTimeMS: number }>
  LapId:              string
  LapNumber:          number
  LapTime:            string
  S1Time:             string
  S2Time:             string
  S3Time:             string
  SessionId:          string
  SessionStartDate:   string
  RecordDate:         string
  Version:            number
  IsDiscarded:        boolean
}

export interface ShtlParseResult {
  /** WorldX,WorldZ,LapDistPct CSV — ready for csvToSvg() */
  csv: string
  /** iRacing-compatible track ID slug, e.g. "adelaide-street-circuit" */
  trackId: string
  trackName:        string
  trackConfig:      string
  displayName:      string
  trackLengthKm:    number | null
  gameName:         string
  carModel:         string | null
  carId:            string | null
  sectorCount:      number
  /** Intermediate sector boundary lap percentages, e.g. [0.328407, 0.634463] */
  sectorBoundaries: number[]
  /** JSON string of sectorBoundaries, ready for DB insert */
  sectorBoundariesJson: string
  pointCount:       number
  lapTime:          string | null
  recordDate:       string | null
  shtlVersion:      number
}

// ── Main parser ────────────────────────────────────────────────────────────────

/**
 * Parse a raw .shtl file buffer (gzip-compressed JSON) into CSV + metadata.
 * Throws on invalid input or insufficient track data.
 */
export function parseShtlBuffer(buffer: Buffer | Uint8Array): ShtlParseResult {
  // 1. Decompress
  let json: string
  try {
    json = gunzipSync(Buffer.from(buffer)).toString('utf8')
  } catch {
    throw new Error('Failed to decompress .shtl file — is it a valid gzip archive?')
  }

  // 2. Parse JSON
  let data: ShtlData
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Failed to parse JSON inside .shtl file')
  }

  return convertShtlData(data)
}

/**
 * Convert an already-parsed .shtl JSON object into CSV + metadata.
 * Pure function — useful for testing or in-memory pipelines.
 */
export function convertShtlData(data: ShtlData): ShtlParseResult {
  const coords = data.CarCoordinates
  if (!Array.isArray(coords) || coords.length === 0) {
    throw new Error('.shtl file contains no CarCoordinates data')
  }

  // 3. Build CSV: WorldX,WorldZ,LapDistPct
  //    Skip the degenerate [0,0,0] sentinel SimHub writes at lap end (p > 0.99)
  const rows: string[] = []
  for (const pt of coords) {
    const [x, , z] = pt.Value
    const p = pt.p
    if (typeof x !== 'number' || typeof z !== 'number' || typeof p !== 'number') continue
    if (x === 0 && z === 0 && p > 0.99) continue
    rows.push(`${x},${z},${p}`)
  }

  if (rows.length < 10) {
    throw new Error(
      `Too few valid track points (${rows.length}); minimum is 10. ` +
      `The recording may be incomplete or corrupted.`
    )
  }

  // 4. Sector boundaries — drop the 0.0 start boundary, keep intermediate ones
  const sectorDefs = data.SectorDefinitions ?? {}
  const sectorBoundaries = Object.values(sectorDefs)
    .sort((a, b) => a - b)
    .filter(v => v > 0)

  // 5. Track ID: use iRacing's TrackName as the base slug (it's already their
  //    canonical identifier, e.g. "adelaide", "spa", "silverstone").
  //    Append the config slug only when it meaningfully distinguishes layouts.
  const iracingBase = slugify(data.TrackName) || slugify(data.TrackDisplayName) || 'unknown-track'
  const configSlug  = slugify(data.TrackConfig ?? '')
  const trackId     = (configSlug && configSlug !== iracingBase)
    ? `${iracingBase}-${configSlug}`
    : iracingBase

  const trackLengthM = data.ReportedTrackLength ?? null
  const trackLengthKm = trackLengthM != null
    ? Math.round(trackLengthM / 10) / 100   // round to 2dp km
    : null

  return {
    csv:                  rows.join('\n'),
    trackId,
    trackName:            data.TrackName        ?? '',
    trackConfig:          data.TrackConfig       ?? '',
    displayName:          data.TrackDisplayName  ?? '',
    trackLengthKm,
    gameName:             (data.GameCode ?? 'iracing').toLowerCase(),
    carModel:             data.CarModel   ?? null,
    carId:                data.CarId      ?? null,
    sectorCount:          Object.keys(sectorDefs).length || 3,
    sectorBoundaries,
    sectorBoundariesJson: JSON.stringify(sectorBoundaries),
    pointCount:           rows.length,
    lapTime:              data.LapTime    ?? null,
    recordDate:           data.RecordDate ?? null,
    shtlVersion:          data.Version    ?? 0,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return (str ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
