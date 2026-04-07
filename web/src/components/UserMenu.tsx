'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, LogOut, ChevronDown } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import ThemeSetSelector from '@/components/ThemeSetSelector'

interface UserMenuProps {
  user: {
    name: string
    image?: string | null
    isAdmin: boolean
    isPluginConnected: boolean
  }
  signOutAction: () => Promise<void>
}

export default function UserMenu({ user, signOutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer hover:bg-[var(--bg-surface)]"
      >
        {/* Connection status dot */}
        {user.isPluginConnected && (
          <span
            className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
            title="SimHub connected"
          />
        )}
        {user.image && (
          <img src={user.image} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
        )}
        <span className="text-xs text-[var(--text-secondary)] font-medium">{user.name}</span>
        <ChevronDown
          size={12}
          className="text-[var(--text-muted)]"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: 220,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            zIndex: 100,
            padding: '8px 0',
          }}
        >
          {/* Theme section */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Theme
            </div>
            <div className="flex flex-col gap-2">
              <ThemeSetSelector />
              <ThemeToggle />
            </div>
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-[var(--border)]" />

          {/* Admin link */}
          {user.isAdmin && (
            <a
              href="/drive/admin"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--k10-red)] transition-colors hover:bg-[var(--bg-surface)]"
              onClick={() => setOpen(false)}
            >
              <Settings size={14} />
              Admin
            </a>
          )}

          {/* Sign out */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-dim)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
