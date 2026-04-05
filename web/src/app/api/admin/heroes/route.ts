import { NextRequest, NextResponse } from 'next/server'
import commentaryTracks from '@/data/commentary_tracks.json'
import commentaryCars from '@/data/commentary_cars.json'

interface TracksData {
  tracks: Record<string, { displayName: string; images?: string[] }>
}

interface CarsData {
  cars: Record<string, { displayName: string; manufacturer: string; images?: string[] }>
}

const tracks = commentaryTracks as TracksData
const cars = commentaryCars as CarsData

const norm = (s: string) => s.toLowerCase().replace(/[-_ ]+/g, '')

/**
 * GET /api/admin/heroes — Pick a random track image and a random brand image
 * from the commentary data for use as hero artwork on the admin overview.
 *
 * ?trackIds=spa,monza,... — limit track hero to ones that match DB tracks (have SVG art)
 * ?brandKeys=bmw,ferrari,... — limit brand hero to ones that match DB brands (have logos)
 */
export async function GET(request: NextRequest) {
  const trackIdsParam = request.nextUrl.searchParams.get('trackIds') || ''
  const brandKeysParam = request.nextUrl.searchParams.get('brandKeys') || ''
  const dbTrackIds = trackIdsParam ? trackIdsParam.split(',').map(norm) : []
  const dbBrandKeys = brandKeysParam ? brandKeysParam.split(',').map(norm) : []

  // Collect all tracks that have images
  let tracksWithImages = Object.entries(tracks.tracks)
    .filter(([, t]) => t.images && t.images.length > 0)
    .map(([key, t]) => ({
      key,
      name: t.displayName,
      images: t.images as string[],
    }))

  // If DB track IDs provided, only pick tracks that have a match
  if (dbTrackIds.length > 0) {
    tracksWithImages = tracksWithImages.filter(t => {
      const nk = norm(t.key)
      return dbTrackIds.some(id => nk.includes(id) || id.includes(nk))
    })
  }

  // Collect all cars (grouped by manufacturer) that have images
  const brandImageMap = new Map<string, { name: string; images: string[] }>()
  for (const [, car] of Object.entries(cars.cars)) {
    if (car.images && car.images.length > 0 && car.manufacturer) {
      const mfr = car.manufacturer.toLowerCase()
      const existing = brandImageMap.get(mfr)
      if (existing) {
        existing.images.push(...car.images)
      } else {
        brandImageMap.set(mfr, { name: car.manufacturer, images: [...car.images] })
      }
    }
  }
  let brandsWithImages = Array.from(brandImageMap.entries()).map(([key, v]) => ({
    key,
    name: v.name,
    images: v.images,
  }))

  // If DB brand keys provided, only pick brands that have a match
  if (dbBrandKeys.length > 0) {
    brandsWithImages = brandsWithImages.filter(b => {
      const nk = norm(b.key)
      return dbBrandKeys.some(id => nk.includes(id) || id.includes(nk))
    })
  }

  // Pick random
  let trackHero: { key: string; name: string; imageUrl: string } | null = null
  if (tracksWithImages.length > 0) {
    const t = tracksWithImages[Math.floor(Math.random() * tracksWithImages.length)]
    trackHero = {
      key: t.key,
      name: t.name,
      imageUrl: t.images[Math.floor(Math.random() * t.images.length)],
    }
  }

  let brandHero: { key: string; name: string; imageUrl: string } | null = null
  if (brandsWithImages.length > 0) {
    const b = brandsWithImages[Math.floor(Math.random() * brandsWithImages.length)]
    brandHero = {
      key: b.key,
      name: b.name,
      imageUrl: b.images[Math.floor(Math.random() * b.images.length)],
    }
  }

  return NextResponse.json({ trackHero, brandHero })
}
