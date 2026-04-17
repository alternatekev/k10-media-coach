'use client'

/**
 * Consistent game badge used across all pages.
 * Shows the game logo (iRacing, ACC, etc.) instead of plain text.
 */

const IRACING_LOGO = (
  <svg viewBox="0 0 486.1 120.7" fill="currentColor" className="h-full w-auto">
    <g>
      <polygon points="51.6 41.4 24.6 41.4 5 84.1 31.9 84.1 51.6 41.4"/>
      <polygon points="58.6 26 31.7 26 27 36.2 53.9 36.2 58.6 26"/>
      <polygon points="320.8 41.4 293.9 41.4 274.3 84.1 301.2 84.1 320.8 41.4"/>
      <polygon points="327.9 26 301 26 296.3 36.2 323.2 36.2 327.9 26"/>
      <path d="M76,68.7h1.7l4.7,15.4h26.9l-4.7-15.4h-1.7c7.4,0,16.3-6.1,19.7-13.7l7.1-15.4c3.5-7.6.3-13.7-7.2-13.7h-53.8l-26.7,58.2h26.9l7.1-15.4ZM93.3,31.1h13.5l-14.9,32.5h-13.5l14.9-32.5Z"/>
      <path d="M355.5,46.5h13.5l-17.3,37.6h26.9l13.3-29.1c3.5-7.6.3-13.7-7.2-13.7h-53.9l-19.6,42.8h26.9l17.4-37.6Z"/>
      <path d="M192.9,41.4h-47.1l-2.4,5.1h33.7l-2.4,5.1h-26.9c-4.3,0-9,2-12.9,5.1-2.9,2.3-5.4,5.3-6.9,8.6l-2.4,5.1c-3.5,7.6-.3,13.7,7.2,13.7h53.9l13.3-29.1c3.6-7.5.4-13.6-7.1-13.6ZM162.2,79h-13.5l10.2-22.2h13.5l-10.2,22.2Z"/>
      <path d="M210.3,84.1h40.4c7.4,0,16.3-6.1,19.7-13.7l.8-1.7h-26.9l-4.7,10.3h-13.5l14.9-32.5h13.5l-4.7,10.3h26.9l.8-1.7c3.5-7.6.3-13.7-7.2-13.7h-40.4c-4.3,0-9,2-12.9,5.1-2.9,2.3-5.4,5.3-6.9,8.6l-7.1,15.4c-3.3,7.5,0,13.6,7.3,13.6Z"/>
      <path d="M421.8,41.4h0c-4.3,0-9,2-12.9,5.1-2.9,2.3-5.4,5.3-6.9,8.6l-7.1,15.4c-1.5,3.2-1.7,6.2-1,8.6,1,3.1,3.9,5.1,8.2,5.1h26.9l-2.4,5.1H2.4l-2.4,5.1h437.9c4.3,0,9-2,12.9-5.1,2.9-2.3,5.4-5.3,6.9-8.6l18-39.3h-53.9ZM431.5,79h-13.5l14.9-32.5h13.5l-14.9,32.5Z"/>
    </g>
  </svg>
)

const GAME_LOGOS: Record<string, React.ReactNode> = {
  iracing: IRACING_LOGO,
  iRacing: IRACING_LOGO,
}

interface GameBadgeProps {
  game: string
  /** Badge height in px — defaults to 12 */
  size?: number
  className?: string
}

export default function GameBadge({ game, size = 12, className = '' }: GameBadgeProps) {
  const logo = GAME_LOGOS[game] || GAME_LOGOS[game.toLowerCase()]

  if (logo) {
    return (
      <span
        className={`inline-flex items-center shrink-0 ${className}`}
        style={{ height: size, color: 'var(--text-dim)' }}
        aria-label={game}
      >
        {logo}
      </span>
    )
  }

  // Fallback: styled text badge for unknown games
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${className}`}
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--text-dim)',
        fontSize: Math.max(size - 2, 8),
        lineHeight: 1,
      }}
    >
      {game}
    </span>
  )
}
