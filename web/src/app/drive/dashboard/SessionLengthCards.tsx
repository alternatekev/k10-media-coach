'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface SessionData {
  finishPosition: number | null
  incidentCount: number | null
  metadata: Record<string, any> | null
}

interface Props {
  sessions: SessionData[]
}

interface Bucket {
  label: string
  criteria: string
  sessions: number
  avgPosition: number | null
  podiumRate: number
  avgIncidents: number
}

function getBucket(completedLaps: number | null | undefined): 0 | 1 | 2 {
  if (!completedLaps) return 0
  if (completedLaps < 15) return 0
  if (completedLaps <= 30) return 1
  return 2
}

export default function SessionLengthCards({ sessions }: Props) {
  const buckets = useMemo(() => {
    const labels = ['Short', 'Medium', 'Long']
    const criteria = ['Under 15 laps', '15 to 30 laps', 'Over 30 laps']
    const positions: number[][] = [[], [], []]
    const incidents: number[][] = [[], [], []]

    for (const s of sessions) {
      const laps = s.metadata?.completedLaps ?? s.metadata?.totalLaps ?? null
      const idx = getBucket(laps)
      if (s.finishPosition != null) positions[idx].push(s.finishPosition)
      incidents[idx].push(s.incidentCount ?? 0)
    }

    return labels.map((label, i): Bucket => {
      const pos = positions[i]
      const inc = incidents[i]
      const count = Math.max(pos.length, inc.length)
      return {
        label,
        criteria: criteria[i],
        sessions: count,
        avgPosition: pos.length > 0 ? pos.reduce((a, b) => a + b, 0) / pos.length : null,
        podiumRate: pos.length > 0 ? pos.filter(p => p >= 1 && p <= 3).length / pos.length : 0,
        avgIncidents: inc.length > 0 ? inc.reduce((a, b) => a + b, 0) / inc.length : 0,
      }
    })
  }, [sessions])

  const maxSessions = Math.max(...buckets.map(b => b.sessions))
  const hasData = sessions.length >= 5

  if (!hasData) {
    return (
      <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 flex flex-col items-center justify-center min-h-[200px]">
        <Zap size={24} className="text-[var(--text-muted)] mb-2 opacity-50" />
        <p className="text-sm text-[var(--text-muted)] text-center">
          Complete 5+ races to see session length stats
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-3" style={{ fontFamily: 'var(--ff-display)' }}>
        <Zap size={24} className="text-[var(--border-accent)]" />
        Session Length
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {buckets.map((bucket) => {
          const isTop = bucket.sessions === maxSessions && bucket.sessions > 0
          return (
            <div
              key={bucket.label}
              className={`rounded-xl p-3 border transition ${
                isTop
                  ? 'border-[var(--k10-red)] bg-[var(--bg-elevated)]'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-bold text-[var(--text-secondary)]" style={{ fontFamily: 'var(--ff-display)' }}>
                    {bucket.label}
                  </span>
                  <span className="ml-1.5" style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--ff)', fontWeight: 300 }}>
                    {bucket.criteria}
                  </span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                  {bucket.sessions} race{bucket.sessions !== 1 ? 's' : ''}
                </span>
              </div>
              {bucket.sessions > 0 ? (
                <div className="flex items-center gap-4 text-sm">
                  {bucket.avgPosition != null && (
                    <div>
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Pos</div>
                      <div className="text-xl font-bold text-[var(--text-dim)] tabular-nums" style={{ fontFamily: 'var(--ff-display)' }}>P{bucket.avgPosition.toFixed(1)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Podium</div>
                    <div className="text-xl font-bold text-green-500 tabular-nums" style={{ fontFamily: 'var(--ff-display)' }}>{(bucket.podiumRate * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Inc</div>
                    <div className="text-xl font-bold text-[var(--text-dim)] tabular-nums" style={{ fontFamily: 'var(--ff-display)' }}>{bucket.avgIncidents.toFixed(1)}</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">No data yet</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer link */}
      <Link
        href="/drive/when"
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-dim)] transition-colors text-right mt-2"
      >
        View full analysis &rarr;
      </Link>
    </div>
  )
}
