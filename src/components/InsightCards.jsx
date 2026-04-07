import React from 'react'
import {
  Flame, EyeOff, Scale, AlertTriangle, Zap, Heart,
} from 'lucide-react'

const ICONS = { Flame, EyeOff, Scale, AlertTriangle, Zap, Heart }

function ScoreRing({ value, color, size = 36 }) {
  const r   = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const arc  = circ * (1 - (value ?? 0) / 100)
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1F2333" strokeWidth={3} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={arc}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        opacity={0.85}
      />
      <text
        x={size/2} y={size/2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fontWeight="600"
      >
        {value ?? 0}
      </text>
    </svg>
  )
}

function InsightCard({ insight }) {
  const IconComp = ICONS[insight.icon] ?? Flame
  const accent   = insight.accent ?? '#E8B86D'

  return (
    <div
      className="flex-shrink-0 rounded-xl p-4 flex gap-3 group transition-all duration-200 hover:border-opacity-80 cursor-default"
      style={{
        width: 280,
        background: 'rgba(17,19,28,0.8)',
        border: `1px solid rgba(54,60,87,0.55)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Icon + ring */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}
        >
          <IconComp size={14} style={{ color: accent }} />
        </div>
        {insight.value !== undefined && (
          <ScoreRing value={insight.value} color={accent} size={34} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="mb-1 font-medium"
          style={{ fontSize: 11, color: accent, letterSpacing: '0.06em' }}
        >
          {insight.title}
        </div>
        {insight.pair && (
          <div
            className="mb-1.5 font-display italic"
            style={{ fontSize: 13, color: '#C2C6D8' }}
          >
            {insight.pair}
          </div>
        )}
        <p
          className="text-ink-300 leading-relaxed"
          style={{ fontSize: 11.5, lineHeight: 1.55 }}
        >
          {insight.body}
        </p>
      </div>
    </div>
  )
}

export function InsightCards({ insights }) {
  if (!insights?.length) return null
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-ink-400 uppercase" style={{ fontSize: 9.5, letterSpacing: '0.2em' }}>
          叙事洞察
        </span>
        <div className="h-px flex-1 bg-ink-700/60" />
        <span className="text-ink-600" style={{ fontSize: 10 }}>
          {insights.length} 个信号
        </span>
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {insights.map(ins => (
          <InsightCard key={ins.id} insight={ins} />
        ))}
      </div>
    </div>
  )
}
