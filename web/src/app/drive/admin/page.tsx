import Link from 'next/link'

export const metadata = {
  title: 'Admin Overview — RaceCor.io Pro Drive',
}

export default function AdminOverviewPage() {
  const sections = [
    {
      title: 'Track Maps',
      description: 'Manage track map SVGs, upload new track data from CSV files',
      href: '/drive/admin/tracks',
    },
    {
      title: 'Car Brands',
      description: 'Manage car brand logos, colors, and artwork uploads',
      href: '/drive/admin/brands',
    },
    {
      title: 'Users',
      description: 'View registered users and their Discord/account information',
      href: '/drive/admin/users',
    },
    {
      title: 'Logs',
      description: 'Monitor API and database operation logs and statistics',
      href: '/drive/admin/logs',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-wide uppercase text-[var(--text)] mb-8">
        Admin Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(section => (
          <Link
            key={section.href}
            href={section.href}
            className="border border-[var(--border)] rounded-lg p-6 bg-[var(--bg-surface)] hover:border-[var(--border-accent)] hover:bg-[var(--bg-panel)] transition-all group"
          >
            <h2 className="text-lg font-bold tracking-wide uppercase text-[var(--k10-red)] mb-2 group-hover:text-[var(--k10-red)]/80 transition-colors">
              {section.title}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
