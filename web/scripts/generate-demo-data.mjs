#!/usr/bin/env node
/**
 * Generate a rich demo dataset for the iracingkev Pro Drive account.
 *
 * Story arc: Rookie → A license over ~14 months across all categories.
 * - Road (primary): 50 races, R→A, iRating 1350→2800
 * - Oval: 25 races, R→B, iRating 1350→2200
 * - Dirt Road: 15 races, R→C, iRating 1350→1900
 * - Dirt Oval: 10 races, R→D, iRating 1350→1600
 * - Formula: 12 races, R→A, iRating 1350→2500
 *
 * Outputs: demo-data.json (for /api/iracing/upload)
 *          demo-seed.json (for /api/admin/seed-demo — rating history with license/SR)
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Helpers ──────────────────────────────────────────────────────────────────

let subsessionCounter = 900000
function nextSubsessionId() { return subsessionCounter++ }

function randomBetween(min, max) { return min + Math.random() * (max - min) }
function randomInt(min, max) { return Math.floor(randomBetween(min, max + 1)) }
function pick(arr) { return arr[randomInt(0, arr.length - 1)] }

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(d) {
  return d.toISOString().replace('T', ' ').replace(/\.\d+Z/, '')
}

// License level mapping: R=1-3, D=4-7, C=8-11, B=12-15, A=16-19, P=20
function licenseToLevel(letter, sr) {
  const base = { R: 1, D: 5, C: 9, B: 13, A: 17, P: 20 }
  // Approximate: base + sr offset (0-3 within class)
  const srOffset = Math.min(3, Math.floor(sr))
  return (base[letter] || 1) + srOffset
}

function srToSubLevel(sr) {
  return Math.round(sr * 100)
}

// ── Track & Car Catalogs ─────────────────────────────────────────────────────

const ROAD_TRACKS = [
  { name: 'Watkins Glen International', config: 'Boot' },
  { name: 'Spa-Francorchamps', config: 'Grand Prix' },
  { name: 'Road Atlanta', config: 'Full Course' },
  { name: 'Suzuka International Racing Course', config: 'Grand Prix' },
  { name: 'Sebring International Raceway', config: 'International' },
  { name: 'Mount Panorama Circuit', config: '' },
  { name: 'Circuit de Barcelona-Catalunya', config: 'Grand Prix' },
  { name: 'WeatherTech Raceway at Laguna Seca', config: 'Full Course' },
  { name: 'Nürburgring Grand-Prix-Strecke', config: '' },
  { name: 'Road America', config: 'Full Course' },
  { name: 'Daytona International Speedway', config: 'Road Course' },
  { name: 'Virginia International Raceway', config: 'Full Course' },
  { name: 'Lime Rock Park', config: 'Full Course' },
  { name: 'Tsukuba Circuit', config: '2000 Full' },
  { name: 'Oulton Park Circuit', config: 'International' },
  { name: 'Okayama International Circuit', config: 'Full Course' },
]

const ROAD_CARS = [
  'Mazda MX-5 Cup',
  'Porsche 911 GT3 Cup (992)',
  'BMW M4 GT3',
  'Ferrari 296 GT3',
  'Mercedes-AMG GT3 2020',
  'Aston Martin Vantage GT4',
  'Porsche 911 GT3 R (992)',
  'Lamborghini Huracán GT3 EVO',
  'Audi R8 LMS GT3 evo II',
]

const ROAD_SERIES = [
  { name: 'Global Mazda MX-5 Cup', license: 'R' },
  { name: 'Porsche Cup Series', license: 'D' },
  { name: 'IMSA Michelin Pilot Challenge', license: 'D' },
  { name: 'GT3 Sprint Series', license: 'C' },
  { name: 'IMSA SportsCar Championship', license: 'B' },
  { name: 'GT Endurance VRS Series', license: 'B' },
  { name: 'Nürburgring Endurance Championship', license: 'A' },
]

const OVAL_TRACKS = [
  { name: 'Charlotte Motor Speedway', config: 'Oval' },
  { name: 'Daytona International Speedway', config: 'Oval' },
  { name: 'Talladega Superspeedway', config: '' },
  { name: 'Richmond Raceway', config: '' },
  { name: 'Bristol Motor Speedway', config: '' },
  { name: 'Texas Motor Speedway', config: 'Oval' },
  { name: 'Las Vegas Motor Speedway', config: 'Oval' },
  { name: 'Homestead Miami Speedway', config: 'Oval' },
  { name: 'Martinsville Speedway', config: '' },
  { name: 'Phoenix Raceway', config: 'Oval' },
]

const OVAL_CARS = [
  'Chevrolet Monte Carlo SS',
  'NASCAR Next Gen Chevrolet Camaro ZL1',
  'NASCAR Next Gen Ford Mustang',
  'NASCAR Next Gen Toyota Camry TRD',
  'Dallara IR18',
]

const OVAL_SERIES = [
  { name: 'NASCAR iRacing Series - Rookie', license: 'R' },
  { name: 'ARCA Menards Series', license: 'D' },
  { name: 'NASCAR Xfinity Series', license: 'C' },
  { name: 'NASCAR Cup Series', license: 'B' },
]

const DIRT_ROAD_TRACKS = [
  { name: 'Crandon International Raceway', config: 'Full' },
  { name: 'Wild West Motorsports Park', config: '' },
  { name: 'Bark River International Raceway', config: '' },
  { name: 'Daytona International Speedway', config: 'Rallycross Short' },
  { name: 'Sonoma Raceway', config: 'Rallycross' },
]

const DIRT_ROAD_CARS = [
  'Ford Fiesta RS WRC',
  'Subaru WRX STI',
  'Volkswagen Beetle GRC Lite',
  'Pro 2 Lite Truck',
  'Pro 4 Truck',
]

const DIRT_ROAD_SERIES = [
  { name: 'Rallycross Series - Rookie', license: 'R' },
  { name: 'iRacing Rallycross Series', license: 'D' },
  { name: 'Pro 2 Lite Off-Road Racing Series', license: 'C' },
]

const DIRT_OVAL_TRACKS = [
  { name: 'Eldora Speedway', config: '' },
  { name: 'Limaland Motorsports Park', config: '' },
  { name: 'Volusia Speedway Park', config: '' },
  { name: 'Williams Grove Speedway', config: '' },
  { name: 'Lanier National Speedway', config: 'Dirt' },
]

const DIRT_OVAL_CARS = [
  'Dirt Street Stock',
  'Dirt Sprint Car - 360',
  'Dirt Sprint Car - 410',
  'Dirt Late Model',
  'Dirt Midget',
]

const DIRT_OVAL_SERIES = [
  { name: 'DIRTcar Street Stock Series', license: 'R' },
  { name: 'DIRTcar 360 Sprint Car Series', license: 'D' },
]

const FORMULA_TRACKS = [
  { name: 'Spa-Francorchamps', config: 'Grand Prix' },
  { name: 'Suzuka International Racing Course', config: 'Grand Prix' },
  { name: 'Circuit de Barcelona-Catalunya', config: 'Grand Prix' },
  { name: 'Autodromo Nazionale Monza', config: 'Grand Prix' },
  { name: 'Silverstone Circuit', config: 'Grand Prix' },
  { name: 'Hungaroring', config: '' },
  { name: 'Interlagos', config: '' },
  { name: 'Red Bull Ring', config: 'Grand Prix' },
]

const FORMULA_CARS = [
  'Formula Vee',
  'iR-04',
  'Dallara F3',
  'Formula Renault 3.5',
  'Mercedes-AMG W13',
]

const FORMULA_SERIES = [
  { name: 'Formula Vee Series', license: 'R' },
  { name: 'iR-04 Fixed Series', license: 'D' },
  { name: 'FIA Formula 3 Championship', license: 'C' },
  { name: 'Grand Prix Series', license: 'A' },
]

// ── Race Generation ──────────────────────────────────────────────────────────

/**
 * Generate a sequence of races with realistic progression.
 * Returns { races, ratingHistory }
 */
function generateCategoryRaces({
  categoryId,
  categoryName,
  tracks,
  cars,
  series,
  raceCount,
  startDate,
  iRatingStart,
  iRatingEnd,
  srProgression, // array of { license, sr } checkpoints
  avgIncidents,
  avgLaps,
  avgFieldSize,
}) {
  const races = []
  const ratingHistory = []

  // Build iRating curve with noise
  const iRatingPoints = []
  for (let i = 0; i < raceCount; i++) {
    const t = i / (raceCount - 1)
    // S-curve with noise for realistic progression
    const sCurve = 1 / (1 + Math.exp(-8 * (t - 0.4)))
    const base = iRatingStart + (iRatingEnd - iRatingStart) * sCurve
    // Add noise: bigger swings mid-career, smaller at start/end
    const noiseAmp = 80 + 200 * Math.sin(Math.PI * t)
    const noise = (Math.random() - 0.5) * noiseAmp
    // Occasional bad streaks
    const badStreak = (i > raceCount * 0.3 && i < raceCount * 0.4) ? -150 : 0
    // Occasional hot streak
    const hotStreak = (i > raceCount * 0.6 && i < raceCount * 0.7) ? 100 : 0
    iRatingPoints.push(Math.round(Math.max(800, base + noise + badStreak + hotStreak)))
  }

  // Build SR/license curve from checkpoints
  function getLicenseAndSR(raceIndex) {
    const t = raceIndex / (raceCount - 1)
    // Find the two surrounding checkpoints
    for (let c = srProgression.length - 1; c >= 0; c--) {
      if (t >= (srProgression[c].at || c / (srProgression.length - 1))) {
        const cp = srProgression[c]
        // Add some SR variation within the class
        // SR caps at 4.00 for R/D/C/B, 5.00 for A/P
        const srNoise = (Math.random() - 0.3) * 0.4
        const srCap = (cp.license === 'A' || cp.license === 'P') ? 4.99 : 3.99
        const sr = Math.max(1.0, Math.min(srCap, cp.sr + srNoise))
        return { license: cp.license, sr: parseFloat(sr.toFixed(2)) }
      }
    }
    return { license: 'R', sr: 2.50 }
  }

  let currentDate = new Date(startDate)
  let prevIR = iRatingStart
  let prevLicense = 'R'
  let prevSR = 2.50

  for (let i = 0; i < raceCount; i++) {
    const postIR = iRatingPoints[i]
    const { license: postLicense, sr: postSR } = getLicenseAndSR(i)
    const preIR = prevIR
    const preSR = prevSR
    const preLicense = prevLicense

    // Pick appropriate series based on license
    const eligibleSeries = series.filter(s => {
      const order = { R: 0, D: 1, C: 2, B: 3, A: 4, P: 5 }
      return (order[s.license] || 0) <= (order[postLicense] || 0)
    })
    const raceSeries = eligibleSeries.length > 0 ? pick(eligibleSeries) : series[0]

    // Pick car appropriate to series level
    const carIndex = Math.min(Math.floor(i / raceCount * cars.length), cars.length - 1)
    const carChoices = cars.slice(Math.max(0, carIndex - 1), carIndex + 2)
    const car = pick(carChoices)

    const track = pick(tracks)
    const fieldSize = randomInt(avgFieldSize - 8, avgFieldSize + 8)
    const laps = randomInt(avgLaps - 5, avgLaps + 8)
    const incidents = Math.max(0, randomInt(0, avgIncidents + 2))

    const iRatingPercentile = (postIR - 800) / 3000
    // Finish position: correlated with career progress (later = better)
    const t = i / (raceCount - 1)
    // Early: mid-pack finishes. Mid: occasional top-5. Late: podiums and wins.
    let finishPosition
    if (t > 0.85 && Math.random() < 0.35) {
      // Late career: wins and podiums
      finishPosition = randomInt(1, 3)
    } else if (t > 0.6 && Math.random() < 0.3) {
      // Mid-late: top 5
      finishPosition = randomInt(2, 5)
    } else if (t > 0.4 && Math.random() < 0.25) {
      // Mid: top 10
      finishPosition = randomInt(4, 10)
    } else {
      // Normal: spread based on progress
      const avgPos = Math.round(fieldSize * (0.7 - t * 0.45))
      finishPosition = Math.max(1, Math.min(fieldSize, avgPos + randomInt(-5, 6)))
    }
    const startPosition = Math.max(1, Math.min(fieldSize, finishPosition + randomInt(-5, 5)))

    // Best lap time: faster at better tracks with higher iRating (in ms, ~80-120s range)
    const baseLapMs = randomInt(75000, 130000)
    const bestLapTime = baseLapMs - Math.round(iRatingPercentile * 5000) + randomInt(-2000, 2000)
    const avgLapTime = bestLapTime + randomInt(500, 3000)

    // SOF correlated with iRating
    const sof = Math.round(postIR * randomBetween(0.7, 1.3))

    // Spread races across ~365 days proportionally, with some variance
    const avgGap = Math.max(0.5, 365 / raceCount)
    const gap = avgGap * randomBetween(0.5, 1.5)
    currentDate = addDays(currentDate, gap)
    // Add time-of-day variance — mix of afternoon, evening, and late-night sessions (local time)
    // Weighted toward evening (most common for sim racers)
    const roll = Math.random()
    let hour
    if (roll < 0.15) hour = randomInt(10, 13)       // morning/early afternoon
    else if (roll < 0.55) hour = randomInt(14, 18)   // afternoon
    else if (roll < 0.90) hour = randomInt(19, 22)   // prime evening
    else hour = randomInt(23, 25) % 24               // late night
    currentDate.setUTCHours(hour, randomInt(0, 59), 0, 0)
    // Never generate races in the future
    if (currentDate > maxDate) currentDate = new Date(maxDate - randomInt(0, 86_400_000 * 3))
    const sessionStart = formatDate(currentDate)

    const subsessionId = nextSubsessionId()

    races.push({
      subsession_id: subsessionId,
      session_id: subsessionId - 100000,
      session_start_time: sessionStart,
      event_type: 5, // race
      event_type_name: 'Race',
      license_category_id: categoryId,
      license_category: categoryName,
      series_name: raceSeries.name,
      series_id: 100 + categoryId * 10 + series.indexOf(raceSeries),
      season_name: `${currentDate.getFullYear()} Season ${Math.ceil((i + 1) / (raceCount / 4))}`,
      season_year: currentDate.getFullYear(),
      season_quarter: Math.ceil((i + 1) / (raceCount / 4)),
      official_session: true,
      num_drivers: fieldSize,
      track: {
        track_name: track.name,
        track_id: 100 + tracks.indexOf(track),
        config_name: track.config,
      },
      car_name: car,
      car_id: 200 + cars.indexOf(car),
      car_class_name: car,
      finish_position: finishPosition,
      finish_position_in_class: finishPosition,
      starting_position: startPosition,
      incidents,
      laps_complete: laps,
      laps_led: finishPosition <= 3 ? randomInt(0, Math.floor(laps / 3)) : 0,
      champ_points: Math.max(0, fieldSize - finishPosition + 1) * 4,
      event_strength_of_field: sof,
      oldi_rating: preIR,
      newi_rating: postIR,
      old_sub_level: srToSubLevel(preSR),
      new_sub_level: srToSubLevel(postSR),
      new_license_level: licenseToLevel(postLicense, postSR),
      best_lap_time: bestLapTime,
      average_lap: avgLapTime,
    })

    ratingHistory.push({
      category: categoryId === 1 ? 'oval' : categoryId === 2 ? 'road' : categoryId === 3 ? 'dirt_oval' : categoryId === 4 ? 'dirt_road' : 'formula',
      iRating: postIR,
      safetyRating: postSR.toFixed(2),
      license: postLicense,
      prevIRating: preIR,
      prevSafetyRating: preSR.toFixed(2),
      prevLicense: preLicense,
      sessionType: 'Race',
      trackName: track.name,
      carModel: car,
      createdAt: sessionStart,
    })

    prevIR = postIR
    prevLicense = postLicense
    prevSR = postSR
  }

  return { races, ratingHistory }
}

// ── Generate All Categories ──────────────────────────────────────────────────

// ── Year-long story: ~350-400 races across categories ────────────────────────
// Active iRacer doing 5-8 races/week. Primary: road. Secondary: oval, formula.
// Dabbles in dirt. Full year from Apr 2025 → Apr 2026.

const startDate = new Date('2025-04-10')
// Cap all dates a few days before "today" so we never generate future races
const maxDate = new Date('2026-04-15T23:59:59Z')

// Road: Primary discipline, ~150 races, R → A, iRating 1350 → 3200
// Story: Slow start in MX-5, finds GT4, struggles in GT3, then clicks at B/A
const road = generateCategoryRaces({
  categoryId: 2,
  categoryName: 'Sports Car',
  tracks: ROAD_TRACKS,
  cars: ROAD_CARS,
  series: ROAD_SERIES,
  raceCount: 150,
  startDate,
  iRatingStart: 1350,
  iRatingEnd: 3200,
  srProgression: [
    // Rookie: careful, learning racecraft
    { at: 0.00, license: 'R', sr: 2.50 },
    { at: 0.03, license: 'R', sr: 3.20 },
    { at: 0.05, license: 'R', sr: 3.60 },
    { at: 0.07, license: 'R', sr: 3.95 },
    // D license: getting confident, a few incidents
    { at: 0.09, license: 'D', sr: 2.20 },
    { at: 0.12, license: 'D', sr: 2.80 },
    { at: 0.15, license: 'D', sr: 3.50 },
    { at: 0.18, license: 'D', sr: 3.95 },
    // C license: jump to GT3 too early, incident spike
    { at: 0.20, license: 'C', sr: 2.00 },
    { at: 0.23, license: 'C', sr: 2.80 },
    { at: 0.26, license: 'C', sr: 2.20 }, // rough patch
    { at: 0.28, license: 'C', sr: 1.60 }, // almost demoted!
    { at: 0.31, license: 'C', sr: 2.10 }, // recovery
    { at: 0.34, license: 'C', sr: 2.80 },
    { at: 0.37, license: 'C', sr: 3.40 },
    { at: 0.40, license: 'C', sr: 3.80 },
    { at: 0.42, license: 'C', sr: 3.95 },
    // B license: solid, consistent, endurance races
    { at: 0.44, license: 'B', sr: 2.50 },
    { at: 0.48, license: 'B', sr: 3.00 },
    { at: 0.52, license: 'B', sr: 3.50 },
    { at: 0.55, license: 'B', sr: 3.20 }, // small dip from a wreck
    { at: 0.58, license: 'B', sr: 3.60 },
    { at: 0.62, license: 'B', sr: 3.80 },
    { at: 0.66, license: 'B', sr: 3.95 },
    // A license: arrived, still climbing iRating
    { at: 0.68, license: 'A', sr: 2.80 },
    { at: 0.72, license: 'A', sr: 3.20 },
    { at: 0.76, license: 'A', sr: 3.50 },
    { at: 0.80, license: 'A', sr: 3.10 }, // endurance race incident
    { at: 0.84, license: 'A', sr: 3.60 },
    { at: 0.88, license: 'A', sr: 3.80 },
    { at: 0.92, license: 'A', sr: 4.10 },
    { at: 0.96, license: 'A', sr: 4.30 },
    { at: 1.00, license: 'A', sr: 4.50 },
  ],
  avgIncidents: 4,
  avgLaps: 18,
  avgFieldSize: 24,
})

// Oval: Secondary, ~80 races, R → B, iRating 1350 → 2400
// Story: Gets hooked on oval after trying Daytona, wrecks a lot early,
// learns drafting, becomes solid mid-pack then occasional winner
const oval = generateCategoryRaces({
  categoryId: 1,
  categoryName: 'Oval',
  tracks: OVAL_TRACKS,
  cars: OVAL_CARS,
  series: OVAL_SERIES,
  raceCount: 80,
  startDate: addDays(startDate, 14),
  iRatingStart: 1350,
  iRatingEnd: 2400,
  srProgression: [
    { at: 0.00, license: 'R', sr: 2.50 },
    { at: 0.04, license: 'R', sr: 3.00 },
    { at: 0.07, license: 'R', sr: 3.60 },
    { at: 0.10, license: 'R', sr: 3.95 },
    { at: 0.12, license: 'D', sr: 2.00 },
    { at: 0.16, license: 'D', sr: 2.60 },
    { at: 0.20, license: 'D', sr: 1.80 }, // Talladega carnage
    { at: 0.24, license: 'D', sr: 2.40 },
    { at: 0.28, license: 'D', sr: 3.20 },
    { at: 0.32, license: 'D', sr: 3.80 },
    { at: 0.36, license: 'D', sr: 3.95 },
    { at: 0.38, license: 'C', sr: 2.50 },
    { at: 0.42, license: 'C', sr: 2.00 }, // NASCAR wrecks again
    { at: 0.46, license: 'C', sr: 1.40 }, // demotion scare
    { at: 0.50, license: 'C', sr: 2.20 },
    { at: 0.54, license: 'C', sr: 3.00 },
    { at: 0.58, license: 'C', sr: 3.50 },
    { at: 0.62, license: 'C', sr: 3.80 },
    { at: 0.66, license: 'C', sr: 3.95 },
    { at: 0.70, license: 'B', sr: 2.50 },
    { at: 0.76, license: 'B', sr: 3.00 },
    { at: 0.82, license: 'B', sr: 3.40 },
    { at: 0.88, license: 'B', sr: 3.80 },
    { at: 0.94, license: 'B', sr: 3.90 },
    { at: 1.00, license: 'B', sr: 3.95 },
  ],
  avgIncidents: 6,
  avgLaps: 40,
  avgFieldSize: 30,
})

// Formula: Tertiary, ~60 races, R → A, iRating 1350 → 2800
// Story: Natural talent in open-wheel, fastest category to A license
const formula = generateCategoryRaces({
  categoryId: 6,
  categoryName: 'Formula Car',
  tracks: FORMULA_TRACKS,
  cars: FORMULA_CARS,
  series: FORMULA_SERIES,
  raceCount: 60,
  startDate: addDays(startDate, 30),
  iRatingStart: 1350,
  iRatingEnd: 2800,
  srProgression: [
    { at: 0.00, license: 'R', sr: 2.50 },
    { at: 0.04, license: 'R', sr: 3.50 },
    { at: 0.07, license: 'R', sr: 3.95 },
    { at: 0.10, license: 'D', sr: 3.00 },
    { at: 0.15, license: 'D', sr: 3.80 },
    { at: 0.20, license: 'D', sr: 3.95 },
    { at: 0.24, license: 'C', sr: 3.00 },
    { at: 0.30, license: 'C', sr: 3.60 },
    { at: 0.36, license: 'C', sr: 3.95 },
    { at: 0.40, license: 'B', sr: 2.80 },
    { at: 0.46, license: 'B', sr: 3.40 },
    { at: 0.52, license: 'B', sr: 3.00 }, // Monza first-lap pile-up
    { at: 0.56, license: 'B', sr: 3.60 },
    { at: 0.62, license: 'B', sr: 3.95 },
    { at: 0.66, license: 'A', sr: 3.00 },
    { at: 0.72, license: 'A', sr: 3.40 },
    { at: 0.80, license: 'A', sr: 3.70 },
    { at: 0.88, license: 'A', sr: 4.00 },
    { at: 0.94, license: 'A', sr: 4.20 },
    { at: 1.00, license: 'A', sr: 4.40 },
  ],
  avgIncidents: 3,
  avgLaps: 20,
  avgFieldSize: 22,
})

// Dirt Road: Casual, ~40 races, R → C, iRating 1350 → 2000
// Story: Picks it up mid-year as a change of pace, enjoys rallycross
const dirtRoad = generateCategoryRaces({
  categoryId: 4,
  categoryName: 'Dirt Road',
  tracks: DIRT_ROAD_TRACKS,
  cars: DIRT_ROAD_CARS,
  series: DIRT_ROAD_SERIES,
  raceCount: 40,
  startDate: addDays(startDate, 90),
  iRatingStart: 1350,
  iRatingEnd: 2000,
  srProgression: [
    { at: 0.00, license: 'R', sr: 2.50 },
    { at: 0.06, license: 'R', sr: 3.00 },
    { at: 0.12, license: 'R', sr: 3.60 },
    { at: 0.18, license: 'R', sr: 3.95 },
    { at: 0.22, license: 'D', sr: 2.50 },
    { at: 0.30, license: 'D', sr: 3.00 },
    { at: 0.38, license: 'D', sr: 3.50 },
    { at: 0.46, license: 'D', sr: 2.80 }, // wild rallycross phase
    { at: 0.54, license: 'D', sr: 3.40 },
    { at: 0.62, license: 'D', sr: 3.80 },
    { at: 0.68, license: 'D', sr: 3.95 },
    { at: 0.74, license: 'C', sr: 2.20 },
    { at: 0.82, license: 'C', sr: 2.80 },
    { at: 0.90, license: 'C', sr: 3.20 },
    { at: 1.00, license: 'C', sr: 3.60 },
  ],
  avgIncidents: 5,
  avgLaps: 12,
  avgFieldSize: 20,
})

// Dirt Oval: Dabble, ~30 races, R → D, iRating 1350 → 1700
// Story: Tries it out, keeps coming back, never fully commits
const dirtOval = generateCategoryRaces({
  categoryId: 3,
  categoryName: 'Dirt Oval',
  tracks: DIRT_OVAL_TRACKS,
  cars: DIRT_OVAL_CARS,
  series: DIRT_OVAL_SERIES,
  raceCount: 30,
  startDate: addDays(startDate, 60),
  iRatingStart: 1350,
  iRatingEnd: 1700,
  srProgression: [
    { at: 0.00, license: 'R', sr: 2.50 },
    { at: 0.08, license: 'R', sr: 3.00 },
    { at: 0.16, license: 'R', sr: 3.50 },
    { at: 0.24, license: 'R', sr: 3.95 },
    { at: 0.30, license: 'D', sr: 2.00 },
    { at: 0.40, license: 'D', sr: 2.60 },
    { at: 0.50, license: 'D', sr: 3.00 },
    { at: 0.60, license: 'D', sr: 2.40 }, // sprint car wrecks
    { at: 0.70, license: 'D', sr: 3.10 },
    { at: 0.80, license: 'D', sr: 3.50 },
    { at: 0.90, license: 'D', sr: 3.80 },
    { at: 1.00, license: 'D', sr: 3.95 },
  ],
  avgIncidents: 5,
  avgLaps: 30,
  avgFieldSize: 22,
})

// ── Combine & add some special races ─────────────────────────────────────────

// Add a couple of dramatic races to road: a win from last, a photo finish loss
const allRaces = [
  ...road.races,
  ...oval.races,
  ...dirtRoad.races,
  ...dirtOval.races,
  ...formula.races,
].sort((a, b) => new Date(a.session_start_time).getTime() - new Date(b.session_start_time).getTime())

// Inject a time trial to test our filter
allRaces.push({
  subsession_id: nextSubsessionId(),
  session_id: 800001,
  session_start_time: formatDate(addDays(startDate, 300)),
  event_type: 4,
  event_type_name: 'Time Trial',
  license_category_id: 2,
  license_category: 'Sports Car',
  series_name: 'Global Mazda MX-5 Cup',
  official_session: true,
  num_drivers: 1,
  track: { track_name: 'Tsukuba Circuit', track_id: 150, config_name: '2000 Full' },
  car_name: 'Mazda MX-5 Cup',
  car_id: 200,
  finish_position: 0,
  starting_position: 0,
  incidents: 0,
  laps_complete: 5,
  laps_led: 0,
  champ_points: 0,
  event_strength_of_field: 0,
  oldi_rating: 2700,
  newi_rating: 2700,
  old_sub_level: 390,
  new_sub_level: 395,
  new_license_level: 1, // The bug! Time trials report this as 1
  best_lap_time: 62500,
  average_lap: 63200,
})

// ── Career Summary (final state) ─────────────────────────────────────────────

const careerSummary = [
  {
    category_id: 2, // road/sports car
    irating: road.ratingHistory[road.ratingHistory.length - 1].iRating,
    safety_rating: parseFloat(road.ratingHistory[road.ratingHistory.length - 1].safetyRating),
    license_level: 18, // A 3.99
    group_name: 'A',
    starts: road.races.length,
    wins: road.races.filter(r => r.finish_position === 1).length,
    top5: road.races.filter(r => r.finish_position <= 5).length,
    incidents: road.races.reduce((sum, r) => sum + r.incidents, 0),
    laps: road.races.reduce((sum, r) => sum + r.laps_complete, 0),
  },
  {
    category_id: 1, // oval
    irating: oval.ratingHistory[oval.ratingHistory.length - 1].iRating,
    safety_rating: parseFloat(oval.ratingHistory[oval.ratingHistory.length - 1].safetyRating),
    license_level: 14, // B 3.40
    group_name: 'B',
    starts: oval.races.length,
    wins: oval.races.filter(r => r.finish_position === 1).length,
    top5: oval.races.filter(r => r.finish_position <= 5).length,
    incidents: oval.races.reduce((sum, r) => sum + r.incidents, 0),
    laps: oval.races.reduce((sum, r) => sum + r.laps_complete, 0),
  },
  {
    category_id: 4, // dirt road
    irating: dirtRoad.ratingHistory[dirtRoad.ratingHistory.length - 1].iRating,
    safety_rating: parseFloat(dirtRoad.ratingHistory[dirtRoad.ratingHistory.length - 1].safetyRating),
    license_level: 10, // C 3.10
    group_name: 'C',
    starts: dirtRoad.races.length,
    wins: dirtRoad.races.filter(r => r.finish_position === 1).length,
    top5: dirtRoad.races.filter(r => r.finish_position <= 5).length,
    incidents: dirtRoad.races.reduce((sum, r) => sum + r.incidents, 0),
    laps: dirtRoad.races.reduce((sum, r) => sum + r.laps_complete, 0),
  },
  {
    category_id: 3, // dirt oval
    irating: dirtOval.ratingHistory[dirtOval.ratingHistory.length - 1].iRating,
    safety_rating: parseFloat(dirtOval.ratingHistory[dirtOval.ratingHistory.length - 1].safetyRating),
    license_level: 7, // D 3.50
    group_name: 'D',
    starts: dirtOval.races.length,
    wins: dirtOval.races.filter(r => r.finish_position === 1).length,
    top5: dirtOval.races.filter(r => r.finish_position <= 5).length,
    incidents: dirtOval.races.reduce((sum, r) => sum + r.incidents, 0),
    laps: dirtOval.races.reduce((sum, r) => sum + r.laps_complete, 0),
  },
  {
    category_id: 6, // formula
    irating: formula.ratingHistory[formula.ratingHistory.length - 1].iRating,
    safety_rating: parseFloat(formula.ratingHistory[formula.ratingHistory.length - 1].safetyRating),
    license_level: 18, // A 3.80
    group_name: 'A',
    starts: formula.races.length,
    wins: formula.races.filter(r => r.finish_position === 1).length,
    top5: formula.races.filter(r => r.finish_position <= 5).length,
    incidents: formula.races.reduce((sum, r) => sum + r.incidents, 0),
    laps: formula.races.reduce((sum, r) => sum + r.laps_complete, 0),
  },
]

// ── Output ───────────────────────────────────────────────────────────────────

const uploadPayload = {
  displayName: 'iracingkev',
  custId: 999001,
  recentRaces: allRaces,
  careerSummary,
}

const seedPayload = {
  ratingHistory: [
    ...road.ratingHistory,
    ...oval.ratingHistory,
    ...dirtRoad.ratingHistory,
    ...dirtOval.ratingHistory,
    ...formula.ratingHistory,
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
}

const outDir = join(__dirname, '..')
writeFileSync(join(outDir, 'demo-data.json'), JSON.stringify(uploadPayload, null, 2))
writeFileSync(join(outDir, 'demo-seed.json'), JSON.stringify(seedPayload, null, 2))

console.log(`✓ demo-data.json: ${allRaces.length} races, ${careerSummary.length} career entries`)
console.log(`✓ demo-seed.json: ${seedPayload.ratingHistory.length} rating history points`)
console.log(`  Road: ${road.races.length} races (${road.ratingHistory[0].iRating} → ${road.ratingHistory.at(-1).iRating} iR)`)
console.log(`  Oval: ${oval.races.length} races (${oval.ratingHistory[0].iRating} → ${oval.ratingHistory.at(-1).iRating} iR)`)
console.log(`  Dirt Road: ${dirtRoad.races.length} races`)
console.log(`  Dirt Oval: ${dirtOval.races.length} races`)
console.log(`  Formula: ${formula.races.length} races`)
console.log(`  + 1 Time Trial (should be filtered)`)
