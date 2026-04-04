'use client'

import { useState, useCallback, useEffect } from 'react'
import { ConnectionLog, LogsResponse, StatCard } from '../components'

export default function LogsSection() {
  const [logs, setLogs] = useState<ConnectionLog[]>([])
  const [stats, setStats] = useState<{ total: number; successful: number; failed: number; avgDuration: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/logs')
      if (!res.ok) throw new Error('Failed to fetch logs')
      const data: LogsResponse = await res.json()
      setLogs(data.logs)
      setStats(data.stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold tracking-wide uppercase text-[var(--text-secondary)]">API & Database Logs</h2>
        <button onClick={fetchLogs} className="px-3 py-1.5 text-sm bg-[var(--k10-red)] text-white rounded hover:brightness-110 transition-all cursor-pointer">Refresh</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Success" value={stats.successful} color="green" />
          <StatCard label="Failed" value={stats.failed} color={stats.failed > 0 ? 'red' : 'muted'} />
          <StatCard label="Avg Duration" value={`${stats.avgDuration}ms`} />
        </div>
      )}

      {loading && <p className="text-[var(--text-muted)] text-sm">Loading logs...</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Timestamp</th>
                <th className="text-left px-4 py-3">Operation</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Duration (ms)</th>
                <th className="text-left px-4 py-3">Error Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-t border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-4 py-3 text-xs text-[var(--text-dim)]">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text)] font-mono">{log.operation}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'success' ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'bg-red-500/20 text-red-400'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-[var(--text-muted)]">{log.duration}</td>
                  <td className="px-4 py-3 text-xs text-red-400">{log.errorDetails || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && logs.length === 0 && (
        <p className="text-[var(--text-muted)] text-sm text-center py-8">No connection logs yet.</p>
      )}
    </div>
  )
}
