import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminNav from './AdminNav'

export const metadata = {
  title: 'Admin — RaceCor.io Pro Drive',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdmin()
  if (!session) redirect('/drive/dashboard')

  return (
    <main className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-6 flex gap-1">
        <AdminNav />
      </nav>

      <div className="max-w-[120rem] mx-auto px-6 py-8">
        {children}
      </div>
    </main>
  )
}
