'use client'

import { useState, type ReactNode } from 'react'
import { MapPin, Car } from 'lucide-react'

type Tab = 'tracks' | 'cars'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'tracks', label: 'Tracks', icon: <MapPin size={14} /> },
  { id: 'cars', label: 'Cars', icon: <Car size={14} /> },
]

export default function SidebarTabs({
  tracksContent,
  carsContent,
}: {
  tracksContent: ReactNode
  carsContent: ReactNode
}) {
  const [active, setActive] = useState<Tab>('tracks')

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
      </div>

      {/* Tab content */}
      {active === 'tracks' && tracksContent}
      {active === 'cars' && carsContent}
    </>
  )
}
