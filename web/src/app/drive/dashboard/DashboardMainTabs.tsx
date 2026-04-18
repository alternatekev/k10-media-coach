'use client'

import { useState, type ReactNode } from 'react'
import { BarChart3, Flag, History, Download } from 'lucide-react'

type Tab = 'performance' | 'next-race' | 'previous-races'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'performance', label: 'Performance', icon: <BarChart3 size={14} /> },
  { id: 'next-race', label: 'Next Race', icon: <Flag size={14} /> },
  { id: 'previous-races', label: 'Previous Races', icon: <History size={14} /> },
]

export default function DashboardMainTabs({
  performanceContent,
  nextRaceContent,
  previousRacesContent,
  footerContent,
  downloadUrl,
}: {
  performanceContent: ReactNode
  nextRaceContent: ReactNode
  previousRacesContent: ReactNode
  footerContent?: ReactNode
  downloadUrl?: string
}) {
  const [active, setActive] = useState<Tab>('performance')

  return (
    <>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 mb-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors relative"
              style={{
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                fontFamily: 'var(--ff)',
              }}
            >
              <span style={{ color: isActive ? 'var(--border-accent)' : 'var(--text-muted)' }}>
                {tab.icon}
              </span>
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: 'var(--border-accent)' }}
                />
              )}
            </button>
          )
        })}
        {downloadUrl && (
          <a
            href={downloadUrl}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm transition-colors"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--ff)', fontWeight: 300 }}
          >
            <Download size={14} />
            Download
          </a>
        )}
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-4">
        {active === 'performance' && performanceContent}
        {active === 'next-race' && nextRaceContent}
        {active === 'previous-races' && previousRacesContent}
        {footerContent}
      </div>
    </>
  )
}
