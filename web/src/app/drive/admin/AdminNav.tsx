'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/drive/admin', label: 'Overview' },
    { href: '/drive/admin/tracks', label: 'Track Maps' },
    { href: '/drive/admin/brands', label: 'Car Brands' },
    { href: '/drive/admin/users', label: 'Users' },
    { href: '/drive/admin/logs', label: 'Logs' },
  ]

  const isActive = (href: string) => {
    // Special case for overview (exact match)
    if (href === '/drive/admin') {
      return pathname === '/drive/admin'
    }
    // For other routes, check if pathname starts with href
    return pathname.startsWith(href)
  }

  return (
    <>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors border-b-2 -mb-[1px] ${
            isActive(item.href)
              ? 'text-[var(--k10-red)] border-[var(--k10-red)]'
              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-dim)]'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  )
}
