'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { WhenInsight, WhenProfile } from '@/lib/when-engine'

function InsightIcon({ type }: { type: WhenInsight['type'] }) {
  const size = 14
  if (type === 'positive') return <TrendingUp size={size} style={{ color: 'hsl(142, 50%, 45%)', flexShrink: 0 }} />
  if (type === 'negative') return <TrendingDown size={size} style={{ color: 'hsl(0, 60%, 45%)', flexShrink: 0 }} />
  return <Minus size={size} style={{ color: 'hsl(0, 0%, 50%)', flexShrink: 0 }} />
}

/* ── Main panel ─────────────────────────────────────────────────── */
export default function WhenInsightsPanel({
  insights,
  profile,
}: {
  insights: WhenInsight[]
  profile: WhenProfile | null
}) {
  if (insights.length === 0 && !profile) return null

  // Compute window averages for subtext
  const windowAvg = (start: number, size: number) => {
    if (!profile) return null
    let totalDelta = 0, count = 0
    for (let i = 0; i < size; i++) {
      const slice = profile.byHour[(start + i) % 24]
      if (slice.avgIRatingDelta !== null && slice.sessionCount > 0) {
        totalDelta += slice.avgIRatingDelta
        count++
      }
    }
    return count > 0 ? totalDelta / count : null
  }

  const peakAvg = profile ? windowAvg(profile.peakHourStart, profile.windowSize) : null
  const worstAvg = profile ? windowAvg(profile.worstHourStart, profile.windowSize) : null

  // Split insights into good / bad
  const good = insights.filter(i => i.type === 'positive' || i.type === 'neutral').slice(0, 3)
  const bad = insights.filter(i => i.type === 'negative').slice(0, 3)

  // Build time-based context paragraphs from profile data
  const peakParagraph = profile ? buildPeakParagraph(profile) : null
  const avoidParagraph = profile ? buildAvoidParagraph(profile) : null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Strengths column */}
      <div className="flex flex-col gap-3">
        <span className="text-sm uppercase tracking-wider font-semibold" style={{ color: 'hsl(142, 50%, 45%)' }}>
          Strengths
        </span>

        {profile && (
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-0.5 shrink-0">
              <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--ff-display)' }}>
                {profile.peakDays}s
              </span>
              <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--ff-display)' }}>
                {profile.peakHours}
              </span>
              {peakAvg != null && (
                <span className="text-[11px] leading-none" style={{ color: 'var(--text-dim)', fontFamily: 'var(--ff-mono)' }}>
                  avg {peakAvg > 0 ? '+' : ''}{peakAvg.toFixed(0)} iR
                </span>
              )}
            </div>
            {peakParagraph && (
              <p
                className="text-base leading-tight pl-4 border-l self-stretch flex items-start"
                style={{ color: 'var(--text-dim)', fontFamily: 'var(--ff)', fontWeight: 300, borderColor: 'var(--border)' }}
              >
                {peakParagraph}
              </p>
            )}
          </div>
        )}

        {good.length > 0 && (
          <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {good.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 leading-snug"
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--ff)',
                  fontWeight: 300,
                }}
              >
                <InsightIcon type={insight.type} />
                <span>{insight.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watch Out column */}
      <div className="flex flex-col gap-3">
        <span className="text-sm uppercase tracking-wider font-semibold" style={{ color: 'hsl(0, 60%, 45%)' }}>
          Watch Out
        </span>

        {profile && (
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-0.5 shrink-0">
              <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--ff-display)' }}>
                {profile.worstDays}s
              </span>
              <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--ff-display)' }}>
                {profile.worstHours}
              </span>
              {worstAvg != null && (
                <span className="text-[11px] leading-none" style={{ color: 'var(--text-dim)', fontFamily: 'var(--ff-mono)' }}>
                  avg {worstAvg > 0 ? '+' : ''}{worstAvg.toFixed(0)} iR
                </span>
              )}
            </div>
            {avoidParagraph && (
              <p
                className="text-base leading-tight pl-4 border-l self-stretch flex items-start"
                style={{ color: 'var(--text-dim)', fontFamily: 'var(--ff)', fontWeight: 300, borderColor: 'var(--border)' }}
              >
                {avoidParagraph}
              </p>
            )}
          </div>
        )}

        {bad.length > 0 && (
          <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            {bad.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 leading-snug"
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--ff)',
                  fontWeight: 300,
                }}
              >
                <InsightIcon type={insight.type} />
                <span>{insight.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Context paragraph builders ────────────────────────────────── */

function buildPeakParagraph(profile: WhenProfile): string {
  const parts: string[] = []

  // Session count in that window
  let peakSessions = 0
  for (let i = 0; i < profile.windowSize; i++) {
    peakSessions += profile.byHour[(profile.peakHourStart + i) % 24].sessionCount
  }
  if (peakSessions > 0) {
    parts.push(`Based on ${peakSessions} races in this window`)
  }

  // Win rate in peak window
  let totalWins = 0, totalRaces = 0
  for (let i = 0; i < profile.windowSize; i++) {
    const h = profile.byHour[(profile.peakHourStart + i) % 24]
    totalWins += h.winRate * h.sessionCount
    totalRaces += h.sessionCount
  }
  if (totalRaces > 0) {
    const winRate = (totalWins / totalRaces * 100).toFixed(0)
    parts.push(`your win rate hits ${winRate}%`)
  }

  // Incident rate in peak window
  let totalInc = 0, incCount = 0
  for (let i = 0; i < profile.windowSize; i++) {
    const h = profile.byHour[(profile.peakHourStart + i) % 24]
    if (h.sessionCount > 0) {
      totalInc += h.avgIncidents * h.sessionCount
      incCount += h.sessionCount
    }
  }
  if (incCount > 0) {
    const avgInc = totalInc / incCount
    parts.push(`incidents drop to ${avgInc.toFixed(1)} avg`)
  }

  return parts.length > 0 ? parts.join(', ') + '.' : ''
}

function buildAvoidParagraph(profile: WhenProfile): string {
  const parts: string[] = []

  // Session count
  let worstSessions = 0
  for (let i = 0; i < profile.windowSize; i++) {
    worstSessions += profile.byHour[(profile.worstHourStart + i) % 24].sessionCount
  }
  if (worstSessions > 0) {
    parts.push(`Across ${worstSessions} races here`)
  }

  // Win rate
  let totalWins = 0, totalRaces = 0
  for (let i = 0; i < profile.windowSize; i++) {
    const h = profile.byHour[(profile.worstHourStart + i) % 24]
    totalWins += h.winRate * h.sessionCount
    totalRaces += h.sessionCount
  }
  if (totalRaces > 0) {
    const winRate = (totalWins / totalRaces * 100).toFixed(0)
    parts.push(`win rate falls to ${winRate}%`)
  }

  // Incident rate
  let totalInc = 0, incCount = 0
  for (let i = 0; i < profile.windowSize; i++) {
    const h = profile.byHour[(profile.worstHourStart + i) % 24]
    if (h.sessionCount > 0) {
      totalInc += h.avgIncidents * h.sessionCount
      incCount += h.sessionCount
    }
  }
  if (incCount > 0) {
    const avgInc = totalInc / incCount
    parts.push(`incidents rise to ${avgInc.toFixed(1)} avg`)
  }

  return parts.length > 0 ? parts.join(', ') + '.' : ''
}
