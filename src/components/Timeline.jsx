import React, { useCallback, useState } from 'react'
import { FATE_MOMENTS } from '../data/sampleData'

export function Timeline({ stages, currentIndex, onChange }) {
  const pct = (currentIndex / Math.max(1, stages.length - 1)) * 100
  const [hoveredMoment, setHoveredMoment] = useState(null)

  const handleChange = useCallback(e => {
    onChange(parseInt(e.target.value, 10))
  }, [onChange])

  return (
    <div className="px-2">
      {/* Stage labels + fate moment markers */}
      <div className="flex justify-between mb-3 relative">
        {stages.map((stage, i) => {
          const active = i === currentIndex
          const past   = i < currentIndex
          const moment = FATE_MOMENTS.find(m => m.stageIndex === i)
          return (
            <div key={stage.id} style={{ flex: 1, minWidth: 0 }} className="relative flex flex-col items-center">
              {/* Fate moment marker */}
              {moment && (
                <div className="relative mb-1">
                  <button
                    className="relative flex items-center justify-center transition-transform hover:scale-125"
                    style={{
                      width: 18, height: 18,
                      background: active ? 'rgba(232,184,109,0.18)' : 'rgba(232,184,109,0.08)',
                      border: `1px solid rgba(232,184,109,${active ? '0.7' : '0.35'})`,
                      borderRadius: 3,
                      transform: 'rotate(45deg)',
                      cursor: 'pointer',
                      fontSize: 0,
                    }}
                    onMouseEnter={() => setHoveredMoment(moment.id)}
                    onMouseLeave={() => setHoveredMoment(null)}
                    onClick={() => onChange(i)}
                  />
                  {/* Tooltip */}
                  {hoveredMoment === moment.id && (
                    <div
                      className="absolute z-50 animate-float-in"
                      style={{
                        bottom: 28,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 220,
                        background: 'rgba(10,11,16,0.97)',
                        border: '1px solid rgba(232,184,109,0.35)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        backdropFilter: 'blur(16px)',
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span style={{ color: '#E8B86D', fontSize: 10, letterSpacing: '0.1em' }}>
                          命运时刻
                        </span>
                        <div style={{ height: 1, flex: 1, background: 'rgba(232,184,109,0.25)' }} />
                      </div>
                      <div className="font-display mb-1.5" style={{ color: '#E8B86D', fontSize: 15 }}>
                        {moment.title}
                      </div>
                      <p className="text-ink-300 leading-relaxed" style={{ fontSize: 11, lineHeight: 1.65 }}>
                        {moment.summary}
                      </p>
                      {/* Arrow */}
                      <div style={{
                        position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                        width: 8, height: 8, background: 'rgba(10,11,16,0.97)',
                        borderRight: '1px solid rgba(232,184,109,0.35)',
                        borderBottom: '1px solid rgba(232,184,109,0.35)',
                      }} />
                    </div>
                  )}
                </div>
              )}
              {!moment && <div style={{ height: 19, marginBottom: 4 }} />}

              {/* Stage dot */}
              <button
                onClick={() => onChange(i)}
                className="flex flex-col items-center gap-1 px-1 group transition-all"
                style={{ minWidth: 0, width: '100%' }}
              >
                <div
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: active ? '#E8B86D' : past ? '#C49050' : '#282D42',
                    boxShadow: active ? '0 0 8px rgba(232,184,109,0.6)' : 'none',
                    transform: active ? 'scale(1.4)' : 'scale(1)',
                  }}
                />
                <span
                  className="text-center leading-tight transition-all duration-300 hidden sm:block"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.04em',
                    color: active ? '#E8B86D' : past ? '#9A7240' : '#363C57',
                    fontWeight: active ? 600 : 400,
                    maxWidth: 90,
                    lineHeight: 1.3,
                  }}
                >
                  {stage.zh}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Slider */}
      <div className="px-1">
        <input
          type="range"
          min={0}
          max={stages.length - 1}
          step={1}
          value={currentIndex}
          onChange={handleChange}
          style={{ '--pct': `${pct}%` }}
        />
      </div>

      {/* Current stage detail */}
      <div className="flex items-center justify-between mt-2.5">
        <div>
          <span className="text-ink-400 uppercase" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
            第 {currentIndex + 1} 幕 / {stages.length}
          </span>
          <span className="mx-2 text-ink-700">·</span>
          <span className="font-display text-gold/60" style={{ fontSize: 14 }}>
            {stages[currentIndex]?.zh}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed text-ink-300 border border-ink-600/50 hover:border-ink-400 hover:text-ink-100 bg-ink-700/30"
            style={{ fontSize: 11 }}
          >
            ← 上一幕
          </button>
          <button
            onClick={() => onChange(Math.min(stages.length - 1, currentIndex + 1))}
            disabled={currentIndex === stages.length - 1}
            className="px-3 py-1 rounded-lg text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed text-ink-300 border border-ink-600/50 hover:border-ink-400 hover:text-ink-100 bg-ink-700/30"
            style={{ fontSize: 11 }}
          >
            下一幕 →
          </button>
        </div>
      </div>
    </div>
  )
}
