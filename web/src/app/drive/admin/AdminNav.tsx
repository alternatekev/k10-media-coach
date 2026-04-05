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

  const toolItems = [
    { href: '/drive/admin/styles', label: 'Styles' },
    { href: '/drive/admin/components', label: 'Components' },
  ]

  const isActive = (href: string) => {
    if (href === '/drive/admin') {
      return pathname === '/drive/admin'
    }
    return pathname.startsWith(href)
  }

  const linkClass = (href: string) =>
    `px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors border-b-2 -mb-[1px] ${
      isActive(href)
        ? 'text-[var(--k10-red)] border-[var(--k10-red)]'
        : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-dim)]'
    }`

  return (
    <div className="flex items-center w-full">
      <div className="flex">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex">
        {toolItems.map(item => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
