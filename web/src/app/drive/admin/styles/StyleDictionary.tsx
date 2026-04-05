'use client'

import { useState } from 'react'

// ── Token definitions ──────────────────────────────────────────────
// Each token group mirrors the :root declarations in globals.css and
// racecor-overlay/modules/styles/base.css. Values are the canonical
// source; the preview column renders a swatch for colors.

type TokenKind = 'color' | 'font' | 'size' | 'radius' | 'timing' | 'weight' | 'opacity'

interface Token {
  name: string          // CSS custom property name
  value: string         // resolved value
  kind: TokenKind
  context: 'web' | 'overlay' | 'shared'
  wcag?: string         // contrast ratio note
  note?: string
}

// ── Color Tokens ──

const colorTokens: Token[] = [
  // Backgrounds
  { name: '--bg', value: '#0a0a14', kind: 'color', context: 'web', note: 'Page background' },
  { name: '--bg-surface', value: 'rgba(16, 16, 32, 0.90)', kind: 'color', context: 'web', note: 'Card / panel surface' },
  { name: '--bg-panel', value: 'rgba(10, 10, 20, 0.95)', kind: 'color', context: 'web', note: 'Nested panel background' },
  { name: '--bg-elevated', value: 'rgba(24, 24, 48, 0.85)', kind: 'color', context: 'web', note: 'Elevated surface (modals, dropdowns)' },
  { name: '--bg', value: 'hsla(0, 0%, 8%, 0.90)', kind: 'color', context: 'overlay', note: 'Overlay HUD background' },
  { name: '--bg-panel', value: 'hsla(0, 0%, 6%, 0.90)', kind: 'color', context: 'overlay', note: 'Overlay panel background' },
  { name: '--bg-logo', value: 'hsla(0, 0%, 12%, 0.90)', kind: 'color', context: 'overlay', note: 'Logo container background' },

  // Borders
  { name: '--border', value: 'rgba(255, 255, 255, 0.14)', kind: 'color', context: 'shared', note: 'Default border' },
  { name: '--border-subtle', value: 'rgba(255, 255, 255, 0.06)', kind: 'color', context: 'web', note: 'Subtle divider' },
  { name: '--border-accent', value: 'rgba(229, 57, 53, 0.35)', kind: 'color', context: 'web', note: 'Accent border (hover, focus)' },

  // Text
  { name: '--text', value: '#e8e8f0', kind: 'color', context: 'web', wcag: '16.2:1 AAA', note: 'Primary text' },
  { name: '--text-primary', value: 'hsla(0, 0%, 100%, 1.0)', kind: 'color', context: 'overlay', wcag: '21:1 AAA', note: 'Overlay primary text' },
  { name: '--text-secondary', value: 'rgba(255, 255, 255, 0.69)', kind: 'color', context: 'shared', wcag: '9.3:1 AAA', note: 'Secondary text' },
  { name: '--text-dim', value: 'rgba(255, 255, 255, 0.55)', kind: 'color', context: 'shared', wcag: '5.9:1 AA', note: 'Dim text / labels' },
  { name: '--text-muted', value: 'rgba(255, 255, 255, 0.45)', kind: 'color', context: 'shared', wcag: '4.0:1 AA-large', note: 'Muted / placeholder' },

  // Brand reds
  { name: '--k10-red', value: '#e53935', kind: 'color', context: 'shared', wcag: '4.7:1 AA', note: 'Primary brand red' },
  { name: '--k10-red-mid', value: '#b02020', kind: 'color', context: 'shared', wcag: '3.3:1 AA-large', note: 'Mid-tone red (decorative / large text)' },
  { name: '--k10-red-dark', value: '#700010', kind: 'color', context: 'shared', wcag: '2.0:1 FAIL', note: 'Dark red (backgrounds only, never text)' },

  // Semantic
  { name: '--green', value: '#43a047', kind: 'color', context: 'shared', note: 'Positive / ahead / gain' },
  { name: '--blue', value: '#1e88e5', kind: 'color', context: 'shared', note: 'Informational / links' },
  { name: '--amber', value: '#ffb300', kind: 'color', context: 'shared', note: 'Warning / caution' },
  { name: '--purple', value: '#7c6cf0', kind: 'color', context: 'web', note: 'Personal best / special' },
  { name: '--purple', value: 'hsl(280, 80%, 70%)', kind: 'color', context: 'overlay', note: 'Overlay purple accent' },
  { name: '--cyan', value: '#00acc1', kind: 'color', context: 'shared', note: 'Player highlight' },
  { name: '--orange', value: '#fb8c00', kind: 'color', context: 'overlay', note: 'Orange (Class D / warnings)' },

  // License classes
  { name: 'Rookie', value: '#e53935', kind: 'color', context: 'web', note: 'iRacing Rookie license' },
  { name: 'Class D', value: '#fb8c00', kind: 'color', context: 'web', note: 'iRacing D license' },
  { name: 'Class C', value: '#ffb300', kind: 'color', context: 'web', note: 'iRacing C license' },
  { name: 'Class B', value: '#43a047', kind: 'color', context: 'web', note: 'iRacing B license' },
  { name: 'Class A', value: '#1e88e5', kind: 'color', context: 'web', note: 'iRacing A license' },
  { name: 'Pro', value: '#6c5ce7', kind: 'color', context: 'web', note: 'iRacing Pro license' },

  // Race control flags
  { name: 'Yellow Flag', value: 'hsl(48, 90%, 55%)', kind: 'color', context: 'overlay', note: 'Caution / full-course yellow' },
  { name: 'Red Flag', value: 'hsl(0, 85%, 55%)', kind: 'color', context: 'overlay', note: 'Session stopped' },
  { name: 'Black Flag', value: 'hsl(0, 75%, 45%)', kind: 'color', context: 'overlay', note: 'Penalty / disqualification' },

  // Connection status
  { name: 'Connected', value: '#4caf50', kind: 'color', context: 'overlay', note: 'Connection active' },
  { name: 'Disconnected', value: '#f44336', kind: 'color', context: 'overlay', note: 'Connection lost' },
  { name: 'Connecting', value: '#ff9800', kind: 'color', context: 'overlay', note: 'Connection pending' },
]

// ── Typography Tokens ──

const typographyTokens: Token[] = [
  { name: '--ff', value: "'Barlow Condensed', 'Corbel', 'Segoe UI', system-ui, sans-serif", kind: 'font', context: 'shared', note: 'Default UI typeface' },
  { name: '--ff-display', value: "'Cinzel Decorative', 'Georgia', serif", kind: 'font', context: 'shared', note: 'Display / hero headings' },
  { name: '--ff-mono', value: "'JetBrains Mono', 'Consolas', 'SF Mono', monospace", kind: 'font', context: 'shared', note: 'Code / numeric tabular data' },
]

const fontSizeTokens: Token[] = [
  { name: '--fs-xl', value: '20px', kind: 'size', context: 'overlay', note: 'Extra large (gear number, position)' },
  { name: '--fs-lg', value: '13px', kind: 'size', context: 'overlay', note: 'Large (section headers)' },
  { name: '--fs-md', value: '11px', kind: 'size', context: 'overlay', note: 'Medium (default body)' },
  { name: '--fs-sm', value: '11px', kind: 'size', context: 'overlay', note: 'Small (labels)' },
  { name: '--fs-xs', value: '10px', kind: 'size', context: 'overlay', note: 'Extra small (footnotes)' },
  { name: 'Base', value: '16px', kind: 'size', context: 'web', note: 'Web app base font size (html/body)' },
]

const fontWeightTokens: Token[] = [
  { name: '--fw-black', value: '800', kind: 'weight', context: 'overlay', note: 'Black — headlines, position number' },
  { name: '--fw-bold', value: '700', kind: 'weight', context: 'overlay', note: 'Bold — section titles, emphasis' },
  { name: '--fw-semi', value: '600', kind: 'weight', context: 'overlay', note: 'Semi-bold — active labels' },
  { name: '--fw-medium', value: '500', kind: 'weight', context: 'overlay', note: 'Medium — default text weight' },
  { name: '--fw-regular', value: '400', kind: 'weight', context: 'overlay', note: 'Regular — body copy, notes' },
]

// ── Spacing & Layout Tokens ──

const spacingTokens: Token[] = [
  { name: '--corner-r', value: '12px', kind: 'radius', context: 'web', note: 'Default border radius' },
  { name: '--corner-r-sm', value: '6px', kind: 'radius', context: 'web', note: 'Small border radius' },
  { name: '--corner-r', value: '8px', kind: 'radius', context: 'overlay', note: 'Overlay border radius' },
  { name: '--corner-r-sm', value: '5px', kind: 'radius', context: 'overlay', note: 'Overlay small radius' },
  { name: '--gap', value: '4px', kind: 'size', context: 'overlay', note: 'Base gap between elements' },
  { name: '--panel-gap', value: '6px', kind: 'size', context: 'overlay', note: 'Gap between adjacent panels' },
  { name: '--edge', value: '10px', kind: 'size', context: 'overlay', note: 'Screen edge inset' },
  { name: '--pad', value: '6px', kind: 'size', context: 'overlay', note: 'Universal padding' },
  { name: '--dash-h', value: '200px', kind: 'size', context: 'overlay', note: 'Main dashboard height' },
]

// ── Timing Tokens ──

const timingTokens: Token[] = [
  { name: '--t-fast', value: '180ms ease', kind: 'timing', context: 'overlay', note: 'Fast transitions (hover, focus)' },
  { name: '--t-med', value: '350ms ease', kind: 'timing', context: 'overlay', note: 'Medium transitions (panels, drawers)' },
  { name: '--t-slow', value: '600ms ease-out', kind: 'timing', context: 'overlay', note: 'Slow transitions (page enter, fade)' },
]

// ── Render helpers ──

function ColorSwatch({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-md border border-[var(--border)] shrink-0"
        style={{ background: value }}
      />
      <code className="text-xs text-[var(--text-dim)] font-mono">{value}</code>
    </div>
  )
}

function FontPreview({ value, name }: { value: string; name: string }) {
  const isDisplay = name.includes('display')
  const isMono = name.includes('mono')
  const sampleText = isMono ? '01234 ∆-0.312s' : isDisplay ? 'K10 Motorsports' : 'Barlow Condensed 600'
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-xl text-[var(--text)]"
        style={{ fontFamily: value, fontWeight: isMono ? 500 : isDisplay ? 700 : 600 }}
      >
        {sampleText}
      </span>
      <code className="text-[14px] text-[var(--text-muted)] font-mono break-all">{value}</code>
    </div>
  )
}

function SizePreview({ value }: { value: string }) {
  const px = parseInt(value, 10)
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-3 rounded-sm bg-[var(--k10-red)] opacity-60 shrink-0"
        style={{ width: `${Math.max(px * 2, 8)}px` }}
      />
      <code className="text-xs text-[var(--text-dim)] font-mono">{value}</code>
    </div>
  )
}

function RadiusPreview({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 border-2 border-[var(--k10-red)] opacity-60 shrink-0"
        style={{ borderRadius: value }}
      />
      <code className="text-xs text-[var(--text-dim)] font-mono">{value}</code>
    </div>
  )
}

function WeightPreview({ value, name }: { value: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-lg text-[var(--text)]"
        style={{ fontFamily: 'var(--ff)', fontWeight: parseInt(value, 10) }}
      >
        {name.replace('--fw-', '')} — Abc 123
      </span>
      <code className="text-xs text-[var(--text-dim)] font-mono">{value}</code>
    </div>
  )
}

function TimingPreview({ value }: { value: string }) {
  const ms = parseInt(value, 10)
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-24 h-3 rounded-full bg-[var(--bg-panel)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--cyan)] opacity-60"
          style={{ width: `${Math.min((ms / 600) * 100, 100)}%` }}
        />
      </div>
      <code className="text-xs text-[var(--text-dim)] font-mono">{value}</code>
    </div>
  )
}

function ContextBadge({ context }: { context: string }) {
  const colors: Record<string, string> = {
    web: 'bg-blue-500/20 text-blue-400',
    overlay: 'bg-purple-500/20 text-purple-400',
    shared: 'bg-green-500/20 text-green-400',
  }
  return (
    <span className={`text-[14px] font-mono px-1.5 py-0.5 rounded ${colors[context] || ''}`}>
      {context}
    </span>
  )
}

function TokenPreview({ token }: { token: Token }) {
  switch (token.kind) {
    case 'color': return <ColorSwatch value={token.value} />
    case 'font': return <FontPreview value={token.value} name={token.name} />
    case 'size': return <SizePreview value={token.value} />
    case 'radius': return <RadiusPreview value={token.value} />
    case 'weight': return <WeightPreview value={token.value} name={token.name} />
    case 'timing': return <TimingPreview value={token.value} />
    default: return <code className="text-xs text-[var(--text-dim)] font-mono">{token.value}</code>
  }
}

// ── Token Table ──

function TokenTable({ tokens, title }: { tokens: Token[]; title: string }) {
  if (tokens.length === 0) return null
  return (
    <section className="mb-12">
      <h2 className="text-lg font-bold tracking-wide uppercase text-[var(--k10-red)] mb-4">
        {title}
      </h2>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--bg-panel)] text-[14px] text-[var(--text-muted)] uppercase tracking-wider">
              <th className="text-left px-4 py-2 font-medium">Token</th>
              <th className="text-left px-4 py-2 font-medium">Preview</th>
              <th className="text-left px-4 py-2 font-medium">Context</th>
              <th className="text-left px-4 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, i) => (
              <tr
                key={`${token.name}-${token.context}-${i}`}
                className="border-t border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <td className="px-4 py-3">
                  <code className="text-sm text-[var(--text)] font-mono">{token.name}</code>
                  {token.wcag && (
                    <span className="ml-2 text-[14px] text-[var(--text-muted)] font-mono">{token.wcag}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TokenPreview token={token} />
                </td>
                <td className="px-4 py-3">
                  <ContextBadge context={token.context} />
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-dim)]">
                  {token.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── Tabs ──

type Tab = 'colors' | 'typography' | 'spacing' | 'timing'

const tabs: { id: Tab; label: string }[] = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Spacing & Layout' },
  { id: 'timing', label: 'Motion' },
]

export default function StyleDictionary() {
  const [activeTab, setActiveTab] = useState<Tab>('colors')

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium tracking-wide uppercase transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'text-[var(--text)] border-[var(--text)]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-dim)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'colors' && (
        <>
          <TokenTable tokens={colorTokens.filter(t => t.note?.toLowerCase().includes('background') || t.name.includes('bg'))} title="Backgrounds" />
          <TokenTable tokens={colorTokens.filter(t => t.name.includes('border'))} title="Borders" />
          <TokenTable tokens={colorTokens.filter(t => t.name.includes('text'))} title="Text" />
          <TokenTable tokens={colorTokens.filter(t => t.name.includes('k10-red') || t.name.includes('--red'))} title="Brand Reds" />
          <TokenTable tokens={colorTokens.filter(t => ['--green', '--blue', '--amber', '--purple', '--cyan', '--orange'].some(s => t.name === s))} title="Semantic Colors" />
          <TokenTable tokens={colorTokens.filter(t => ['Rookie', 'Class D', 'Class C', 'Class B', 'Class A', 'Pro'].includes(t.name))} title="License Classes" />
          <TokenTable tokens={colorTokens.filter(t => t.name.includes('Flag') || t.name.includes('Connected') || t.name.includes('Disconnected') || t.name.includes('Connecting'))} title="Status Indicators" />
        </>
      )}

      {activeTab === 'typography' && (
        <>
          <TokenTable tokens={typographyTokens} title="Font Families" />
          <TokenTable tokens={fontSizeTokens} title="Font Sizes" />
          <TokenTable tokens={fontWeightTokens} title="Font Weights" />
        </>
      )}

      {activeTab === 'spacing' && (
        <>
          <TokenTable tokens={spacingTokens.filter(t => t.kind === 'radius')} title="Border Radii" />
          <TokenTable tokens={spacingTokens.filter(t => t.kind === 'size')} title="Spacing & Dimensions" />
        </>
      )}

      {activeTab === 'timing' && (
        <TokenTable tokens={timingTokens} title="Transition Timing" />
      )}
    </div>
  )
}
