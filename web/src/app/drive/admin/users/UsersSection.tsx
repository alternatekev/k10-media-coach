'use client'

import { useState, useEffect } from 'react'
import { User } from '../components'

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => setUsers(data.users))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2 className="text-lg font-bold tracking-wide uppercase text-[var(--text-secondary)] mb-4">
        Registered Users ({users.length})
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Read-only view. To remove users, manage access through Discord moderation.
      </p>

      {loading && <p className="text-[var(--text-muted)] text-sm">Loading...</p>}

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Discord ID</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Tokens</th>
              <th className="text-right px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.discordAvatar && user.discordId ? (
                      <img src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=32`} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-panel)]" />
                    )}
                    <div>
                      <div className="text-[var(--text)] font-medium">{user.discordDisplayName || user.discordUsername}</div>
                      <div className="text-xs text-[var(--text-muted)]">@{user.discordUsername}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--text-dim)] font-mono text-xs">{user.discordId}</td>
                <td className="px-4 py-3 text-[var(--text-dim)]">{user.email || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${user.activeTokens > 0 ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'bg-[var(--bg-panel)] text-[var(--text-muted)]'}`}>
                    {user.activeTokens}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-muted)]">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && users.length === 0 && (
        <p className="text-[var(--text-muted)] text-sm text-center py-8">No registered users.</p>
      )}
    </div>
  )
}
