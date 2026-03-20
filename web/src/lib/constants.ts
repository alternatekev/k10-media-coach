// K10 Motorsports — Shared constants

export const SITE_NAME = 'K10 Motorsports'
export const SITE_URL = 'https://k10motorsports.com'
export const DRIVE_URL = 'https://drive.k10motorsports.com'
export const SITE_DESCRIPTION = 'Real-time sim racing telemetry overlay with AI commentary, sector analysis, and driver performance tracking.'

// iRacing license classes and their rating categories
export const LICENSE_CLASSES = ['R', 'D', 'C', 'B', 'A', 'P'] as const
export type LicenseClass = typeof LICENSE_CLASSES[number]

export const LICENSE_LABELS: Record<LicenseClass, string> = {
  R: 'Rookie', D: 'Class D', C: 'Class C', B: 'Class B', A: 'Class A', P: 'Pro',
}

export const LICENSE_COLORS: Record<LicenseClass, string> = {
  R: '#e53935', D: '#fb8c00', C: '#ffb300', B: '#43a047', A: '#1e88e5', P: '#6c5ce7',
}

// iRacing rating categories (each has its own iRating + SR)
export const RATING_CATEGORIES = ['road', 'oval', 'dirt_road', 'dirt_oval', 'sports_car'] as const
export type RatingCategory = typeof RATING_CATEGORIES[number]

export const CATEGORY_LABELS: Record<RatingCategory, string> = {
  road: 'Road', oval: 'Oval', dirt_road: 'Dirt Road', dirt_oval: 'Dirt Oval', sports_car: 'Sports Car',
}

// Brand palette (matches dashboard CSS variables + logomark colors)
export const COLORS = {
  bg: '#0a0a14',
  surface: 'rgba(16, 16, 32, 0.90)',
  elevated: 'rgba(24, 24, 48, 0.85)',
  border: 'rgba(255, 255, 255, 0.14)',
  text: '#e8e8f0',
  textSecondary: 'rgba(255, 255, 255, 0.69)',
  textDim: 'rgba(255, 255, 255, 0.55)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  // K10 logomark three-tone reds
  k10Red: '#e53935',
  k10RedMid: '#b02020',
  k10RedDark: '#700010',
  // Semantic
  green: '#43a047',
  blue: '#1e88e5',
  amber: '#ffb300',
  purple: '#7c6cf0',
  cyan: '#00acc1',
} as const
