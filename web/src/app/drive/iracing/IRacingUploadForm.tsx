'use client'

import { useState, useCallback } from 'react'

type ImportResult = {
  success: boolean
  imported?: { sessions: number; ratings: number }
  received?: { races: number; careerSummary: number }
  trackMappings?: Record<string, string>
  errors?: string[]
  error?: string
}

type DedupeResult = {
  success: boolean
  totalSessions?: number
  duplicatesRemoved?: number
  remaining?: number
  error?: string
}

export default function IRacingUploadForm() {
  const [json, setJson] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [dedupeStatus, setDedupeStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [dedupeResult, setDedupeResult] = useState<DedupeResult | null>(null)
  const [clearStatus, setClearStatus] = useState<'idle' | 'confirm' | 'running' | 'done'>('idle')
  const [clearResult, setClearResult] = useState<string | null>(null)
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [demoMessage, setDemoMessage] = useState<string | null>(null)

  const handleDedupe = useCallback(async () => {
    setDedupeStatus('running')
    setDedupeResult(null)
    try {
      const res = await fetch('/api/iracing/dedupe', { method: 'POST' })
      const data = await res.json()
      setDedupeResult(data)
    } catch (err: any) {
      setDedupeResult({ success: false, error: err.message })
    }
    setDedupeStatus('done')
  }, [])

  const handleClear = useCallback(async () => {
    if (clearStatus !== 'confirm') {
      setClearStatus('confirm')
      return
    }
    setClearStatus('running')
    setClearResult(null)
    try {
      const res = await fetch('/api/iracing/clear', { method: 'POST' })
      const data = await res.json()
      setClearResult(data.success ? `Deleted ${data.deleted} sessions.` : `Error: ${data.error}`)
    } catch (err: any) {
      setClearResult(`Error: ${err.message}`)
    }
    setClearStatus('done')
  }, [clearStatus])

  const handleLoadDemo = useCallback(async () => {
    setDemoStatus('loading')
    setDemoMessage(null)
    try {
      // Fetch both demo files in parallel
      const [dataRes, seedRes] = await Promise.all([
        fetch('/demo/demo-data.json'),
        fetch('/demo/demo-seed.json'),
      ])
      if (!dataRes.ok || !seedRes.ok) throw new Error('Failed to fetch demo data files')

      const uploadData = await dataRes.json()
      const seedData = await seedRes.json()

      // Single call to seed-demo which handles: user creation, clear, import, ratings
      const res = await fetch('/api/admin/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadData,
          ratingHistory: seedData.ratingHistory,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Seed failed')
      }

      setDemoStatus('done')
      setDemoMessage(
        `Loaded ${result.sessionsImported} races, ${result.ratingHistoryInserted} rating points across ${result.categories?.join(', ')}. Refresh to see your dashboard.`
      )
    } catch (err: any) {
      setDemoStatus('error')
      setDemoMessage(err.message || 'Failed to load demo data')
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!json.trim()) return

    setStatus('uploading')
    setResult(null)

    try {
      let payload = JSON.parse(json)

      // Flatten nested arrays: [[{race1}, {race2}]] → [{race1}, {race2}]
      if (Array.isArray(payload)) {
        while (payload.length === 1 && Array.isArray(payload[0])) {
          payload = payload[0]
        }
      }

      // Accept either the full export format or raw member_recent_races array
      const body = Array.isArray(payload)
        ? {
            recentRaces: payload,
          }
        : payload

      // Normalize iRacing field names if present
      if (body.cust_id && !body.custId) {
        body.custId = body.cust_id
        body.displayName = body.display_name || body.displayName || ''
      }

      const res = await fetch('/api/iracing/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data: ImportResult = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
        setResult(data)
      } else {
        setStatus('error')
        setResult(data)
      }
    } catch (err: any) {
      setStatus('error')
      setResult({ success: false, error: err.message || 'Invalid JSON' })
    }
  }, [json])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setJson(reader.result as string)
      reader.readAsText(file)
    }
  }, [])

  return (
    <div>
      {/* JSON input area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--border-accent)' : 'var(--border)'}`,
          borderRadius: '8px',
          transition: 'border-color 0.15s',
        }}
      >
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder={`Paste iRacing JSON here, or drag a .json file...\n\nAccepted formats:\n• Full export: { "custId": 12345, "displayName": "...", "recentRaces": [...], "careerSummary": [...], "chartData": {...} }\n• Member info: { "cust_id": 12345, "display_name": "..." }\n• Recent races array: [{ "subsession_id": ..., ... }]`}
          rows={12}
          className="w-full text-xs font-mono p-4 resize-y focus:outline-none"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            caretColor: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleSubmit}
          disabled={!json.trim() || status === 'uploading'}
          className="px-5 py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{
            background: 'var(--k10-red, #e53935)',
            color: '#fff',
          }}
        >
          {status === 'uploading' ? 'Importing...' : 'Import to Pro Drive'}
        </button>

        {json.trim() && (
          <button
            onClick={() => { setJson(''); setStatus('idle'); setResult(null) }}
            className="text-sm text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Result */}
      {result && status === 'success' && (
        <div
          className="mt-6 p-4 rounded-lg text-sm"
          style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}
        >
          <p className="font-semibold" style={{ color: '#66bb6a' }}>Import complete</p>
          <p className="text-[var(--text-dim)] mt-1">
            {result.imported?.sessions ?? 0} sessions, {result.imported?.ratings ?? 0} categories
          </p>
          {result.received && (
            <p className="text-xs text-[var(--text-dim)] mt-1 opacity-60">
              (Received {result.received.races} races, {result.received.careerSummary} summary entries)
            </p>
          )}
          {result.trackMappings && Object.keys(result.trackMappings).length > 0 && (
            <details className="text-xs text-[var(--text-dim)] mt-2 opacity-60">
              <summary>Track mappings ({Object.keys(result.trackMappings).length})</summary>
              <div className="mt-1 font-mono">
                {Object.entries(result.trackMappings).map(([from, to]) => (
                  <div key={from}>
                    {from === to
                      ? <span style={{ color: '#ef5350' }}>{from} (no match)</span>
                      : <span>{from} <span style={{ color: '#66bb6a' }}>→ {to}</span></span>
                    }
                  </div>
                ))}
              </div>
            </details>
          )}
          {result.errors && result.errors.length > 0 && (
            <details className="text-xs text-[var(--text-dim)] mt-2 opacity-60">
              <summary>{result.errors.length} error(s)</summary>
              <pre className="mt-1 whitespace-pre-wrap">{result.errors.join('\n')}</pre>
            </details>
          )}
        </div>
      )}

      {result && status === 'error' && (
        <div
          className="mt-6 p-4 rounded-lg text-sm"
          style={{ background: 'rgba(229, 57, 53, 0.1)', border: '1px solid rgba(229, 57, 53, 0.3)' }}
        >
          <p className="font-semibold" style={{ color: '#ef5350' }}>Import failed</p>
          <p className="text-[var(--text-dim)] mt-1">{result.error || 'Unknown error'}</p>
        </div>
      )}

      {/* Dedupe */}
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-sm text-[var(--text-dim)] mb-3">
          Remove duplicate race sessions — keeps the most complete version of each race.
        </p>
        <button
          onClick={handleDedupe}
          disabled={dedupeStatus === 'running'}
          className="px-4 py-2 rounded-md text-sm transition-opacity disabled:opacity-40"
          style={{
            background: 'var(--surface-secondary, #333)',
            color: 'var(--text-primary)',
          }}
        >
          {dedupeStatus === 'running' ? 'Deduplicating...' : 'Remove Duplicates'}
        </button>
        {dedupeResult && (
          <p className="text-sm text-[var(--text-dim)] mt-2">
            {dedupeResult.success
              ? `Removed ${dedupeResult.duplicatesRemoved} duplicates. ${dedupeResult.remaining} sessions remaining.`
              : `Error: ${dedupeResult.error}`}
          </p>
        )}

        <div className="mt-4">
          <button
            onClick={handleClear}
            disabled={clearStatus === 'running'}
            className="px-4 py-2 rounded-md text-sm transition-opacity disabled:opacity-40"
            style={{
              background: clearStatus === 'confirm' ? 'var(--k10-red, #e53935)' : 'var(--surface-secondary, #333)',
              color: clearStatus === 'confirm' ? '#fff' : 'var(--text-primary)',
            }}
          >
            {clearStatus === 'running' ? 'Clearing...'
              : clearStatus === 'confirm' ? 'Click again to confirm — this deletes everything'
              : 'Clear All Race History'}
          </button>
          {clearResult && (
            <p className="text-sm text-[var(--text-dim)] mt-2">{clearResult}</p>
          )}
        </div>
      </div>

      {/* Demo Data */}
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Demo Data
        </p>
        <p className="text-sm text-[var(--text-dim)] mb-3">
          Load a year of sample race data — 360 races across all categories with a full Rookie → A license progression story. Replaces any existing data.
        </p>
        <button
          onClick={handleLoadDemo}
          disabled={demoStatus === 'loading'}
          className="px-5 py-2 rounded-md text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{
            background: 'var(--k10-red, #e53935)',
            color: '#fff',
          }}
        >
          {demoStatus === 'loading' ? 'Loading demo data...' : 'Load Demo Data'}
        </button>
        {demoMessage && (
          <div
            className="mt-3 p-3 rounded-lg text-sm"
            style={{
              background: demoStatus === 'error'
                ? 'rgba(229, 57, 53, 0.1)'
                : 'rgba(76, 175, 80, 0.1)',
              border: `1px solid ${demoStatus === 'error' ? 'rgba(229, 57, 53, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
              color: demoStatus === 'error' ? '#ef5350' : '#66bb6a',
            }}
          >
            {demoMessage}
          </div>
        )}
      </div>
    </div>
  )
}
