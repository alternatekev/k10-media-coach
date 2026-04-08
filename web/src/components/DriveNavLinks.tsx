'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Clock,
  Dna,
  CalendarClock,
  MapPin,
  Sparkles,
  Upload,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/drive/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/drive/career', label: 'Career', icon: Clock },
  { href: '/drive/dna', label: 'DNA', icon: Dna },
  { href: '/drive/when', label: 'When', icon: CalendarClock },
  { href: '/drive/tracks', label: 'Tracks & Cars', icon: MapPin },
  { href: '/drive/moments', label: 'Moments', icon: Sparkles },
  { href: '/drive/iracing', label: 'iRacing Import', icon: Upload },
]

export default function DriveNavLinks() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              px-3 py-2 flex items-center gap-1.5
              text-xs font-medium whitespace-nowrap
              border-b-2 transition-colors
              ${
                isActive
                  ? 'text-[var(--text-secondary)] border-b-[var(--k10-red)]'
                  : 'text-[var(--text-muted)] border-b-transparent hover:text-[var(--text-dim)]'
              }
            `}
          >
            <Icon size={14} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
