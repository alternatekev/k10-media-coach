'use client'

import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Trophy, Medal, Shield, TrendingUp, Star,
  MapPin, Car, Clock, Flame, HeartCrack, ArrowUpFromLine,
  X,
} from 'lucide-react'
import GameBadge from '@/components/GameBadge'
import { detectMoments, type Moment, type SessionRecord, type RatingRecord } from '@/lib/moments'
import type { BrandInfo } from '@/types/brand'

// ── Shared design constants (same as RecentMoments dashboard cards) ──────────

const ICON: Record<string, (size: number) => React.ReactNode> = {
  win_streak:        (s) => <Trophy size={s} />,
  podium_streak:     (s) => <Medal size={s} />,
  clean_streak:      (s) => <Shield size={s} />,
  milestone_irating: (s) => <TrendingUp size={s} />,
  license_promotion: (s) => <ArrowUpFromLine size={s} />,
  comeback:          (s) => <Flame size={s} />,
  personal_best:     (s) => <Star size={s} />,
  new_track:         (s) => <MapPin size={s} />,
  new_car:           (s) => <Car size={s} />,
  century:           (s) => <Clock size={s} />,
  iron_man:          (s) => <Flame size={s} />,
  heartbreak:        (s) => <HeartCrack size={s} />,
}

const ACCENT: Record<string, string> = {
  win_streak:        '#ffd700',
  podium_streak:     '#ffd700',
  clean_streak:      '#43a047',
  milestone_irating: '#e53935',
  license_promotion: '#1e88e5',
  comeback:          '#ff9800',
  personal_best:     '#7c6cf0',
  new_track:         '#00acc1',
  new_car:           '#00acc1',
  century:           '#ffb300',
  iron_man:          '#ff5722',
  heartbreak:        '#e53935',
}

const HIGHLIGHT_GRADIENT: Record<string, string> = {
  win_streak:        'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)',
  podium_streak:     'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)',
  clean_streak:      'linear-gradient(135deg, rgba(67,160,71,0.15) 0%, rgba(67,160,71,0.05) 100%)',
  milestone_irating: 'linear-gradient(135deg, rgba(229,57,53,0.15) 0%, rgba(229,57,53,0.05) 100%)',
  license_promotion: 'linear-gradient(135deg, rgba(30,136,229,0.15) 0%, rgba(30,136,229,0.05) 100%)',
  comeback:          'linear-gradient(135deg, rgba(255,152,0,0.15) 0%, rgba(255,152,0,0.05) 100%)',
  iron_man:          'linear-gradient(135deg, rgba(255,87,34,0.15) 0%, rgba(255,87,34,0.05) 100%)',
}

interface Lookups {
  trackMapLookup: Record<string, string>
  trackLogoLookup: Record<string, string>
  trackDisplayNameLookup: Record<string, string>
  brandLogoLookup: Record<string, BrandInfo>
}

interface MomentsDrawerProps extends Lookups {
  sessions: SessionRecord[]
  ratingHistory: RatingRecord[]
}

const trackKey = (name: string | undefined | null) => (name || '').toLowerCase()

function formatRelative(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const days = Math.floor((now - then) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function brandLogoSrc(info: BrandInfo): string | null {
  if (info.logoSvg) return `data:image/svg+xml,${encodeURIComponent(info.logoSvg)}`
  if (info.logoPng) return `data:image/png;base64,${info.logoPng}`
  return null
}

function hasRecentMoments(moments: Moment[]): boolean {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return moments.some((m) => new Date(m.date) > sevenDaysAgo)
}

function groupMomentsByMonth(moments: Moment[]): Map<string, Moment[]> {
  const grouped = new Map<string, Moment[]>()
  moments.forEach((moment) => {
    const date = new Date(moment.date)
    const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(moment)
  })
  return grouped
}

// ── Badge content (context-aware: track map, brand logo, or icon) ────────────

function BadgeContent({ moment, lookups, size }: { moment: Moment; lookups: Lookups; size: 'sm' | 'lg' }) {
  const accent = ACCENT[moment.type] || '#888'
  const icon = ICON[moment.type]
  const tKey = trackKey(moment.trackName)
  const trackSvgPath = lookups.trackMapLookup[tKey] || null
  const trackLogoSvg = lookups.trackLogoLookup[tKey] || null
  const brandInfo = moment.carModel ? lookups.brandLogoLookup[moment.carModel] ?? null : null
  const logoSrc = brandInfo ? brandLogoSrc(brandInfo) : null

  const isCarMoment = moment.type === 'new_car'
  const isTrackMoment = moment.type === 'new_track'
  const tint = `brightness(0) invert(1) drop-shadow(0 0 2px ${accent})`
  const iconSize = size === 'lg' ? 18 : 14
  const svgClass = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'
  const imgClass = size === 'lg' ? 'w-6 h-6 object-contain' : 'w-5 h-5 object-contain'

  if (isCarMoment && logoSrc) {
    return <img src={logoSrc} alt="" className={imgClass} style={{ filter: tint, opacity: 0.8 }} />
  }
  if (isTrackMoment && trackSvgPath) {
    return (
      <svg viewBox="0 0 100 100" className={svgClass} style={{ opacity: 0.8 }}>
        <path d={trackSvgPath} fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (trackSvgPath) {
    return (
      <svg viewBox="0 0 100 100" className={svgClass} style={{ opacity: 0.8 }}>
        <path d={trackSvgPath} fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (trackLogoSvg) {
    return <img src={`data:image/svg+xml,${encodeURIComponent(trackLogoSvg)}`} alt="" className={imgClass} style={{ filter: tint, opacity: 0.8 }} />
  }
  if (logoSrc) {
    return <img src={logoSrc} alt="" className={imgClass} style={{ filter: tint, opacity: 0.8 }} />
  }
  return icon ? icon(iconSize) : <Star size={iconSize} />
}

// ── Highlight card (top moments — rich design) ──────────────────────────────

function HighlightCard({ moment, lookups }: { moment: Moment; lookups: Lookups }) {
  const accent = ACCENT[moment.type] || '#888'
  const icon = ICON[moment.type]
  const bg = HIGHLIGHT_GRADIENT[moment.type] || 'var(--bg-elevated)'

  return (
    <div
      className="rounded-xl border p-4 overflow-hidden"
      style={{ background: bg, borderColor: `${accent}30` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
          style={{ background: `${accent}20`, color: accent }}
        >
          <BadgeContent moment={moment} lookups={lookups} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold leading-tight" style={{ color: accent }}>
              {moment.title}
            </span>
          </div>
          <p className="text-xs text-[var(--text-dim)] leading-snug line-clamp-2 mb-1.5">
            {moment.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{formatRelative(moment.date)}</span>
            {moment.gameName && (
              <>
                <span className="opacity-40">·</span>
                <GameBadge game={moment.gameName} size={10} />
              </>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-bold leading-none" style={{ color: accent }}>
            {moment.significance}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Timeline row (compact, with track/brand context) ─────────────────────────

function TimelineRow({ moment, lookups }: { moment: Moment; lookups: Lookups }) {
  const accent = ACCENT[moment.type] || '#888'

  return (
    <div
      className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent}12 0%, ${accent}04 100%)`,
        border: `1px solid ${accent}20`,
      }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
        style={{ background: `${accent}18`, color: accent }}
      >
        <BadgeContent moment={moment} lookups={lookups} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold leading-none truncate" style={{ color: accent }}>
            {moment.title}
          </span>
          <span className="text-xs text-[var(--text-muted)] leading-none shrink-0">
            {formatRelative(moment.date)}
          </span>
        </div>
        <p className="text-xs text-[var(--text-dim)] leading-tight truncate mt-0.5">
          {moment.description}
        </p>
      </div>
    </div>
  )
}

// ── Drawer ───────────────────────────────────────────────────────────────────

export default function MomentsDrawer({
  sessions,
  ratingHistory,
  trackMapLookup,
  trackLogoLookup,
  trackDisplayNameLookup,
  brandLogoLookup,
}: MomentsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const moments = useMemo(() => detectMoments(sessions, ratingHistory), [sessions, ratingHistory])

  // Reverse chronological: newest first
  const sorted = useMemo(() => [...moments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [moments])
  const highlights = sorted.slice(0, 5)
  const grouped = groupMomentsByMonth(sorted)
  const hasRecent = hasRecentMoments(moments)
  const lookups: Lookups = { trackMapLookup, trackLogoLookup, trackDisplayNameLookup, brandLogoLookup }

  useEffect(() => {
    setMounted(true)
  }, [])

  const drawerContent = (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        id="moments-drawer"
        className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-[var(--bg-elevated)] border-l border-[var(--border)] z-[70] flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moments-drawer-title"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[var(--text-secondary)]" id="moments-drawer-title">Moments</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
            aria-label="Close moments drawer"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {moments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Star size={32} className="text-[var(--text-muted)] opacity-40 mb-3" />
              <p className="text-sm text-[var(--text-muted)]">Keep racing to unlock your first milestone!</p>
            </div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <section className="px-3 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-[var(--text-secondary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]" style={{ fontFamily: 'var(--ff-display)' }}>
                  Highlights
                </h3>
              </div>
              <div className="space-y-2">
                {highlights.map((moment, idx) => (
                  <HighlightCard key={`hl-${moment.type}-${moment.date}-${idx}`} moment={moment} lookups={lookups} />
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          {moments.length > 0 && (
            <section className="px-3 py-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} className="text-[var(--text-secondary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]" style={{ fontFamily: 'var(--ff-display)' }}>
                  Timeline
                </h3>
              </div>
              <div className="space-y-4">
                {Array.from(grouped.entries()).map(([month, monthMoments]) => (
                  <div key={month}>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                      {month}
                    </h4>
                    <div className="space-y-1.5">
                      {monthMoments.map((moment, idx) => (
                        <TimelineRow key={`${moment.type}-${moment.date}-${idx}`} moment={moment} lookups={lookups} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* View All */}
          {moments.length > 0 && (
            <div className="px-3 py-4 border-t border-[var(--border)]">
              <Link
                href="/drive/moments"
                className="inline-block w-full text-center px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View All Moments
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors relative flex-shrink-0"
        aria-label={`Moments${moments.length > 0 && hasRecent ? ' (new)' : ''}`}
        aria-expanded={isOpen}
        aria-controls="moments-drawer"
      >
        <Star size={20} aria-hidden="true" />
        {moments.length > 0 && hasRecent && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
        )}
      </button>

      {mounted && createPortal(drawerContent, document.body)}
    </>
  )
}
