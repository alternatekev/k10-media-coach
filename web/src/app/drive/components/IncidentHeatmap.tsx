'use client'

import { useRef, useMemo } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export type IncidentHeatmapProps = {
  svgPath: string
  incidents: Array<{
    trackPosition: number
    count: number
    type?: string
  }>
  sectorBoundaries?: number[]
  trackName?: string
  width?: number
  height?: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getColorForIncidentCount(count: number): string {
  if (count === 1) return '#10b981' // emerald-500
  if (count <= 3) return '#f59e0b' // amber-500
  return '#f43f5e' // rose-500
}

function getRadiusForIncidentCount(count: number): number {
  const minRadius = 4
  const maxRadius = 16
  // Scale count 1-10 to radius 4-16
  const scaled = minRadius + ((count - 1) / 9) * (maxRadius - minRadius)
  return Math.min(Math.max(scaled, minRadius), maxRadius)
}

// Parse SVG path and create a measurement path
function createPathElement(svgPath: string): SVGPathElement | null {
  if (!svgPath) return null
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', svgPath)
  return path
}

function getPointOnPath(
  pathElement: SVGPathElement | null,
  trackPosition: number // 0-1
): { x: number; y: number } | null {
  if (!pathElement) return null

  try {
    const totalLength = pathElement.getTotalLength()
    const distance = trackPosition * totalLength
    const point = pathElement.getPointAtLength(distance)
    return { x: point.x, y: point.y }
  } catch {
    return null
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function IncidentHeatmap({
  svgPath,
  incidents,
  sectorBoundaries,
  trackName,
  width = 400,
  height = 400,
}: IncidentHeatmapProps) {
  const pathRef = useRef<SVGPathElement>(null)

  // Create invisible path for measurement
  const measurePath = useMemo(() => {
    if (typeof document === 'undefined') return null
    return createPathElement(svgPath)
  }, [svgPath])

  // Get positions for all incidents
  const incidentPositions = useMemo(() => {
    return incidents.map(inc => ({
      ...inc,
      point: getPointOnPath(measurePath, inc.trackPosition),
    }))
  }, [incidents, measurePath])

  // Empty state
  if (!svgPath || incidents.length === 0) {
    return (
      <div
        className="rounded-lg bg-zinc-900 border border-zinc-700 p-6 flex items-center justify-center"
        style={{ width, height }}
      >
        <div className="text-center">
          <p className="text-sm text-zinc-400">No incident data available</p>
          {!svgPath && <p className="text-xs text-zinc-500 mt-1">Track map not found</p>}
          {svgPath && incidents.length === 0 && (
            <p className="text-xs text-zinc-500 mt-1">Complete races to see incident locations</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4">
      <div className="mb-3">
        {trackName && (
          <h3 className="text-sm font-semibold text-zinc-100">{trackName}</h3>
        )}
        <p className="text-xs text-zinc-400 mt-1">
          {incidents.length} location{incidents.length !== 1 ? 's' : ''} with{' '}
          {incidents.reduce((sum, inc) => sum + inc.count, 0)} total incident
          {incidents.reduce((sum, inc) => sum + inc.count, 0) !== 1 ? 's' : ''}
        </p>
      </div>

      <svg
        viewBox="0 0 100 100"
        width={width}
        height={height}
        className="border border-zinc-700 rounded bg-zinc-950"
      >
        {/* Hidden reference path for measurements */}
        <path
          ref={pathRef}
          d={svgPath}
          fill="none"
          stroke="none"
          pointerEvents="none"
        />

        {/* Track outline */}
        <path
          d={svgPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="0.5"
          pointerEvents="none"
        />

        {/* Sector boundaries */}
        {sectorBoundaries && sectorBoundaries.length > 0 && (
          <g opacity="0.3">
            {sectorBoundaries.map((boundary, idx) => {
              const point = getPointOnPath(measurePath, boundary)
              if (!point) return null

              return (
                <circle
                  key={`boundary-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r="1.5"
                  fill="rgba(100, 150, 200, 0.5)"
                />
              )
            })}
          </g>
        )}

        {/* Incident circles */}
        {incidentPositions.map((inc, idx) => {
          if (!inc.point) return null

          const color = getColorForIncidentCount(inc.count)
          const radius = getRadiusForIncidentCount(inc.count)
          const radiusPercent = (radius / width) * 100

          return (
            <g key={`incident-${idx}`}>
              {/* Outer glow */}
              <circle
                cx={inc.point.x}
                cy={inc.point.y}
                r={radiusPercent * 1.4}
                fill={color}
                opacity="0.15"
              />

              {/* Main circle */}
              <circle
                cx={inc.point.x}
                cy={inc.point.y}
                r={radiusPercent}
                fill={color}
                opacity="0.8"
              />

              {/* Border */}
              <circle
                cx={inc.point.x}
                cy={inc.point.y}
                r={radiusPercent}
                fill="none"
                stroke={color}
                strokeWidth="0.2"
                opacity="0.6"
              />

              {/* Label if multiple incidents at same spot */}
              {inc.count > 1 && (
                <text
                  x={inc.point.x}
                  y={inc.point.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="2"
                  fontWeight="bold"
                  opacity="0.9"
                  pointerEvents="none"
                >
                  {inc.count}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-zinc-400">1 incident</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-zinc-400">2–3 incidents</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-zinc-400">4+ incidents</span>
        </div>
      </div>
    </div>
  )
}
