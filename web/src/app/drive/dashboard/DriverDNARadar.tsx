'use client'

import { useMemo } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Target } from 'lucide-react'
import { computeDriverDNA, getDriverArchetype } from '@/lib/driver-dna'

interface SessionData {
  finishPosition: number | null
  incidentCount: number | null
  metadata: Record<string, any> | null
  carModel: string
  trackName: string | null
  gameName: string | null
  createdAt: string
}

interface RatingData {
  iRating: number
  prevIRating: number | null
  createdAt: string
}

interface Props {
  sessions: SessionData[]
  ratingHistory: RatingData[]
}

export default function DriverDNARadar({ sessions, ratingHistory }: Props) {
  const { radarData, archetype, hasData } = useMemo(() => {
    const dna = computeDriverDNA(sessions, ratingHistory)
    const arch = getDriverArchetype(dna)
    const hasEnoughData = sessions.length >= 3

    const data = [
      { dimension: 'Consistency', value: dna.consistency, fullMark: 100 },
      { dimension: 'Racecraft', value: dna.racecraft, fullMark: 100 },
      { dimension: 'Cleanness', value: dna.cleanness, fullMark: 100 },
      { dimension: 'Endurance', value: dna.endurance, fullMark: 100 },
      { dimension: 'Adaptability', value: dna.adaptability, fullMark: 100 },
      { dimension: 'Improvement', value: dna.improvement, fullMark: 100 },
      dna.wetWeather !== 50 ? { dimension: 'Wet Weather', value: dna.wetWeather, fullMark: 100 } : null,
      { dimension: 'Experience', value: dna.experience, fullMark: 100 },
    ].filter(Boolean)

    return { radarData: data, archetype: arch, hasData: hasEnoughData }
  }, [sessions, ratingHistory])

  if (!hasData) {
    return (
      <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 h-full flex flex-col items-center justify-center min-h-[200px]">
        <Target size={24} className="text-[var(--text-muted)] mb-2 opacity-50" />
        <p className="text-sm text-[var(--text-muted)] text-center">
          Complete 3+ races to unlock your Driver DNA
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 h-full relative flex flex-col">
      {/* Header */}
      <div className="mb-2">
        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>Driver DNA</span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-semibold" style={{ fontSize: 16, color: 'var(--text-secondary)', fontFamily: 'var(--ff-display)' }}>{archetype.variant}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--ff)', fontWeight: 300 }}>{archetype.major}</span>
        </div>
        <p className="whitespace-pre-line leading-relaxed mt-1" style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--ff)', fontWeight: 300, fontStyle: 'italic' }}>
          {archetype.variantDescription}
        </p>
      </div>

      {/* Radar Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 14 }} />
            <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 13 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'var(--text)' }}
            />
            <Radar name="Driver DNA" dataKey="value" stroke="#e53935" fill="#e53935" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
