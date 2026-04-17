'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { computeTrackMastery, type TrackMastery } from '@/lib/mastery'
import { getTrackLocation, type TrackLocation } from '@/data/track-metadata'
import GameBadge from '@/components/GameBadge'

interface RaceSession {
  id: string
  carModel: string
  manufacturer: string
  trackName: string
  finishPosition: number | null
  incidentCount: number
  metadata: Record<string, any> | null
  createdAt: string
  gameName: string
}

interface TrackVisual {
  svgPath?: string
  logoSvg?: string
  logoPng?: string
  imageUrl?: string
}

interface Props {
  sessions: RaceSession[]
  heroImageUrl: string | null
  heroSvgPath: string | null
  trackVisuals: Record<string, TrackVisual>
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffSec < 60) return 'now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return `${diffWeek}w ago`
}

function formatPosition(pos: number): string {
  return `P${pos.toFixed(1)}`
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  diamond: '#b9f2ff'
}

function TierBadge({ tier }: { tier: TrackMastery['masteryTier'] }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-[rgba(0,0,0,0.4)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)]" style={{ color: TIER_COLORS[tier] }}>
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: TIER_COLORS[tier] }}
      />
      <span>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
    </div>
  )
}

function MasteryProgressRing({ score, color }: { score: number; color: string }) {
  const circumference = 2 * Math.PI * 18
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="var(--border)"
        strokeWidth="3"
      />
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-secondary)"
        fontSize="11"
        fontWeight="bold"
      >
        {score}
      </text>
    </svg>
  )
}

function TrendIndicator({ trend }: { trend: string }) {
  let arrow = '→'
  let label = 'Stable'

  if (trend === 'improving') {
    arrow = '↑'
    label = 'Improving'
  } else if (trend === 'declining') {
    arrow = '↓'
    label = 'Declining'
  } else if (trend === 'new') {
    arrow = '●'
    label = 'New'
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-[var(--text-dim)]">
      <span>{arrow}</span>
      <span>{label}</span>
    </div>
  )
}

function TrackCard({ track, color, visual }: { track: TrackMastery; color: string; visual?: TrackVisual }) {
  const hasImage = !!visual?.imageUrl
  const hasSvg = !!visual?.svgPath
  const hasLogo = !!(visual?.logoSvg || visual?.logoPng)
  const location = getTrackLocation(track.trackName)

  return (
    <Link
      href={`/drive/track/${encodeURIComponent(track.trackName)}`}
      className="group rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden flex flex-col transition-colors hover:border-[var(--border-accent)]"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* Visual header — large abstract track map as the dominant element */}
      <div className="relative h-44 overflow-hidden bg-[var(--bg-panel)]">
        {/* Background photo — very subtle */}
        {hasImage && (
          <img
            src={visual!.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-25 transition-opacity"
          />
        )}

        {/* Track map SVG — LARGE, cropped, abstract — the hero of the card */}
        {hasSvg && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              className="w-[200%] h-[200%] opacity-40 group-hover:opacity-60 transition-opacity"
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: 'blur(0.3px)' }}
            >
              <path
                d={visual!.svgPath}
                fill="none"
                stroke="var(--track-stroke)"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Gradient fade — bottom to card body, left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-elevated)]/60 to-transparent" />

        {/* Top row: flag + location | logo */}
        <div className="absolute top-3 left-4 right-4 flex items-start justify-between z-10">
          <div className="flex items-center gap-2">
            {location && (
              <span className="text-base leading-none">{location.flag}</span>
            )}
            {location && (
              <span className="text-xs text-[var(--text-dim)]">{location.city}</span>
            )}
          </div>
          {hasLogo && (
            <div className="w-7 h-7 opacity-50">
              {visual?.logoSvg ? (
                <div dangerouslySetInnerHTML={{ __html: visual.logoSvg }} className="w-full h-full [&>svg]:w-full [&>svg]:h-full" />
              ) : visual?.logoPng ? (
                <img src={`data:image/png;base64,${visual.logoPng}`} alt="" className="w-full h-full object-contain" />
              ) : null}
            </div>
          )}
        </div>

        {/* Bottom overlay: track name + tier badge */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="bg-[var(--bg-elevated)] rounded-full p-0.5">
              <MasteryProgressRing score={track.masteryScore} color={TIER_COLORS[track.masteryTier]} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)] leading-tight" style={{ fontFamily: 'var(--ff-display)' }}>
                {track.trackName}
              </h3>
              {location && (
                <span className="text-xs text-[var(--text-muted)]">{location.country}</span>
              )}
            </div>
          </div>
          <TierBadge tier={track.masteryTier} />
        </div>
      </div>

      {/* Card body — stats + metadata */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex gap-5 text-sm">
          <div>
            <span className="text-xs text-[var(--text-dim)] block">Sessions</span>
            <span className="font-semibold text-[var(--text-secondary)]">{track.totalSessions}</span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-dim)] block">Avg Pos</span>
            <span className="font-semibold text-[var(--text-secondary)]">
              {track.avgPosition !== null ? formatPosition(track.avgPosition) : '—'}
            </span>
          </div>
          <div>
            <span className="text-xs text-[var(--text-dim)] block">Inc/Race</span>
            <span className="font-semibold text-[var(--text-secondary)]">{track.avgIncidents.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <TrendIndicator trend={track.trend} />
            {track.gameNames.length > 0 && (
              <div className="flex items-center gap-1.5">
                {track.gameNames.map(game => (
                  <GameBadge key={game} game={game} size={10} />
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-[var(--text-dim)]">{formatRelativeTime(track.lastRaced)}</span>
        </div>
      </div>
    </Link>
  )
}

export default function TrackMasteryPage({ sessions, heroImageUrl, heroSvgPath, trackVisuals }: Props) {
  const tracks = useMemo(() => {
    const converted = sessions.map(s => ({
      ...s,
      createdAt: new Date(s.createdAt)
    }))
    return computeTrackMastery(converted)
  }, [sessions])

  const totalSessions = sessions.length
  const uniqueTracks = new Set(sessions.map(s => s.trackName)).size

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[var(--bg-panel)]">
        {heroImageUrl && (
          <img src={heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
        )}
        {heroSvgPath && (
          <div className="absolute inset-0 flex items-center justify-end pointer-events-none opacity-30 pr-16">
            <svg viewBox="0 0 100 100" className="w-[500px] h-[500px]" preserveAspectRatio="xMidYMid meet">
              <path d={heroSvgPath} fill="none" stroke="var(--border-accent)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-panel)] via-[var(--bg-panel)]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />

        <div className="relative z-10 px-6 pt-8 pb-10 max-w-6xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-[var(--text)]" style={{ fontFamily: 'var(--ff-display)' }}>
            Track Mastery
          </h1>
          <p className="text-sm text-[var(--text-dim)] mt-2 max-w-xl">
            Master the circuits. See your progression at every track.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-3xl font-black text-[var(--text)]" style={{ fontFamily: 'var(--ff-display)' }}>{uniqueTracks}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-[var(--text)]" style={{ fontFamily: 'var(--ff-display)' }}>{totalSessions}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {tracks.length === 0 ? (
          <div className="py-12 px-8 text-center bg-[var(--bg-elevated)] border border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)]">
            <p>Hit the track and your mastery profile will build automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map(track => {
              // Try exact match first, then case-insensitive
              const visual = trackVisuals[track.trackName]
                || Object.entries(trackVisuals).find(([k]) => k.toLowerCase() === track.trackName.toLowerCase())?.[1]
              return (
                <TrackCard key={track.trackName} track={track} color={TIER_COLORS[track.masteryTier]} visual={visual} />
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
