import React from 'react'
import { MODES } from '../data/sampleData'

export function ModeToggle({ mode, onModeChange }) {
  return (
    <div
      className="flex items-center rounded-xl p-1 gap-0.5"
      style={{ background: '#11131C', border: '1px solid #1F2333' }}
    >
      {MODES.map(m => {
        const active = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className="relative px-4 py-1.5 rounded-lg transition-all duration-200"
            style={{
              fontSize: 12,
              letterSpacing: '0.04em',
              background: active ? '#1F2333' : 'transparent',
              color: active ? '#E8B86D' : '#555B7A',
              fontWeight: active ? 600 : 400,
              boxShadow: active ? '0 0 12px rgba(232,184,109,0.08) inset' : 'none',
              border: active ? '1px solid rgba(232,184,109,0.2)' : '1px solid transparent',
            }}
          >
            {m.zh}
          </button>
        )
      })}
    </div>
  )
}
