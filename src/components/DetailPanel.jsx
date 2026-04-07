import React from 'react'
import { X, Sparkles, Eye, RotateCcw } from 'lucide-react'
import { RELATIONSHIP_TYPES, bkimg } from '../data/sampleData'

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-ink-300" style={{ fontSize: 11, letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ color, fontSize: 12, fontWeight: 600 }}>{value}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

// ── Node Detail ───────────────────────────────────────────────────────────────
function NodeDetail({ node, perspectiveMode, onTogglePerspective }) {
  const [imgFailed, setImgFailed] = React.useState(false)

  return (
    <div className="animate-float-in">
      {/* Header: photo thumbnail + name/role */}
      <div className="p-4 border-b border-ink-700/50">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{
              width: 96, height: 116,
              border: `1.5px solid ${node.color}44`,
              background: `radial-gradient(circle at 35% 30%, ${node.color}28, #0A0B10)`,
            }}
          >
            {node.avatarUrl && !imgFailed ? (
              <img
                src={bkimg(node.avatarUrl)}
                alt={node.name}
                className="w-full h-full object-cover object-top"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-2xl opacity-30"
                   style={{ color: node.color }}>
                {node.name[0]}
              </div>
            )}
          </div>

          {/* Name / actor / role / traits */}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl leading-tight mb-0.5" style={{ color: node.color }}>
              {node.name}
            </h2>
            {node.actor && (
              <p className="text-ink-300 mb-0.5" style={{ fontSize: 11 }}>
                {node.actor} 饰
              </p>
            )}
            <p className="text-ink-500 mb-2" style={{ fontSize: 9.5, letterSpacing: '0.10em' }}>
              {node.role}
            </p>
            <div className="flex flex-wrap gap-1">
              {node.traits?.map(trait => (
                <span
                  key={trait}
                  className="px-1.5 py-0.5 rounded text-ink-200 border border-ink-600/50"
                  style={{ fontSize: 9.5, background: '#1F2333' }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 角色视角 toggle */}
        <button
          onClick={onTogglePerspective}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all"
          style={{
            background: perspectiveMode ? 'rgba(155,108,246,0.15)' : 'rgba(31,35,51,0.6)',
            border: perspectiveMode ? '1px solid rgba(155,108,246,0.5)' : '1px solid rgba(54,60,87,0.4)',
            color: perspectiveMode ? '#B07EF0' : '#6B7290',
            fontSize: 11,
            letterSpacing: '0.06em',
          }}
        >
          <Eye size={12} />
          {perspectiveMode ? '退出视角模式' : '以此角色视角观察'}
        </button>
      </div>

      {/* Description */}
      <div className="p-5 border-b border-ink-700/50">
        <div className="text-ink-400 uppercase mb-2" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
          角色简介
        </div>
        <p className="text-ink-200 leading-relaxed" style={{ fontSize: 13 }}>
          {node.description}
        </p>
      </div>

      {/* Current emotional state */}
      {node.currentEmotionalState && (
        <div className="p-5 border-b border-ink-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-gold-dim" />
            <span className="text-ink-400 uppercase" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
              当前情感状态
            </span>
          </div>
          <p className="text-ink-100 leading-relaxed italic font-display" style={{ fontSize: 14 }}>
            {node.currentEmotionalState}
          </p>
        </div>
      )}

      {/* Narrative weight */}
      <div className="p-5">
        <div className="text-ink-400 uppercase mb-3" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
          叙事权重
        </div>
        <ScoreBar label="故事重要性" value={node.narrativeWeight * 10} color={node.color} />
        <p className="text-ink-500 mt-3 leading-relaxed" style={{ fontSize: 11 }}>
          该角色叙事权重为 {node.narrativeWeight}/10，反映其承载了多少故事的情感质量。
        </p>
      </div>
    </div>
  )
}

// ── Score Slider ──────────────────────────────────────────────────────────────
function ScoreSlider({ label, value, baseValue, color, onChange }) {
  const delta = value - baseValue
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-ink-300" style={{ fontSize: 11 }}>{label}</span>
        <div className="flex items-center gap-1.5">
          {delta !== 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: delta > 0 ? '#6ACFAA' : '#DC7070',
            }}>
              {delta > 0 ? '+' : ''}{Math.round(delta)}
            </span>
          )}
          <span style={{ color, fontSize: 12, fontWeight: 600 }}>{Math.round(value)}</span>
        </div>
      </div>
      <input
        type="range"
        min={0} max={100} step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ '--pct': `${value}%` }}
      />
    </div>
  )
}

// ── Edge Detail ───────────────────────────────────────────────────────────────
function EdgeDetail({ edge, characters, overrideScores, onScoreOverride, onResetOverride }) {
  const srcChar = characters.find(c => c.id === edge.source)
  const tgtChar = characters.find(c => c.id === edge.target)
  const typeInfo = RELATIONSHIP_TYPES[edge.primaryType] ?? RELATIONSHIP_TYPES.trust

  const overrides = overrideScores[edge.id] ?? {}
  const hasOverride = Object.keys(overrides).length > 0

  const getVal = (key) => overrides[key] ?? edge[key] ?? 50
  const baseVal = (key) => edge[key] ?? 50

  return (
    <div className="animate-float-in">
      {/* Relationship header */}
      <div className="p-5 border-b border-ink-700/50">
        <div className="flex items-center gap-2 mb-3">
          <svg width="22" height="6">
            <line x1="1" y1="3" x2="21" y2="3"
              stroke={typeInfo.color} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={typeInfo.dashArray ?? undefined}
            />
          </svg>
          <span style={{ color: typeInfo.color, fontSize: 11, letterSpacing: '0.10em', fontWeight: 500 }}>
            {typeInfo.label}
          </span>
        </div>

        <h2 className="font-display text-xl leading-tight text-ink-50 mb-1">
          {edge.label}
        </h2>

        {/* Character pair */}
        <div className="flex items-center gap-3 mt-3">
          {[srcChar, tgtChar].map((char, i) => char && (
            <React.Fragment key={char.id}>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: `${char.color}20`, border: `1px solid ${char.color}55`, color: char.color }}
                >
                  {char.name[0]}
                </div>
                <span className="text-ink-200 font-display" style={{ fontSize: 14 }}>{char.name}</span>
              </div>
              {i === 0 && <span className="text-ink-600">×</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Quote */}
      {edge.quote && (
        <div className="px-5 py-4 border-b border-ink-700/50">
          <p
            className="font-display italic leading-relaxed"
            style={{ fontSize: 14.5, color: typeInfo.color, opacity: 0.85 }}
          >
            「{edge.quote}」
          </p>
        </div>
      )}

      {/* Scores */}
      <div className="p-5 border-b border-ink-700/50 space-y-3.5">
        <div className="text-ink-400 uppercase mb-1" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
          关系评分 · 当前阶段
        </div>
        <ScoreBar label="情感张力"  value={edge.tensionScore   ?? 0} color="#E8B86D" />
        <ScoreBar label="深情"      value={edge.affectionScore ?? 0} color="#E87A9A" />
        <ScoreBar label="信任"      value={edge.trustScore     ?? 0} color="#4A8CC4" />
        <ScoreBar label="权力失衡"  value={Math.abs((edge.powerScore ?? 50) - 50) * 2} color="#E0602B" />
      </div>

      {/* 如果推演 — What-if sliders */}
      <div className="p-5 border-b border-ink-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={11} className="text-amethyst-bright" />
            <span className="text-ink-400 uppercase" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
              如果推演
            </span>
          </div>
          {hasOverride && (
            <button
              onClick={() => onResetOverride(edge.id)}
              className="flex items-center gap-1 text-ink-500 hover:text-ink-300 transition-colors"
              style={{ fontSize: 10 }}
            >
              <RotateCcw size={10} />
              重置
            </button>
          )}
        </div>
        <p className="text-ink-500 mb-3" style={{ fontSize: 10.5, lineHeight: 1.6 }}>
          拖动滑块，假设这段关系的数值变化，实时观察图谱联动。
        </p>
        <div className="space-y-3">
          <ScoreSlider label="情感张力" value={getVal('tensionScore')}   baseValue={baseVal('tensionScore')}   color="#E8B86D" onChange={v => onScoreOverride(edge.id, 'tensionScore',   v)} />
          <ScoreSlider label="深情"     value={getVal('affectionScore')} baseValue={baseVal('affectionScore')} color="#E87A9A" onChange={v => onScoreOverride(edge.id, 'affectionScore', v)} />
          <ScoreSlider label="信任"     value={getVal('trustScore')}     baseValue={baseVal('trustScore')}     color="#4A8CC4" onChange={v => onScoreOverride(edge.id, 'trustScore',     v)} />
          <ScoreSlider label="权力（源→目）" value={getVal('powerScore')} baseValue={baseVal('powerScore')}  color="#E0602B" onChange={v => onScoreOverride(edge.id, 'powerScore',     v)} />
        </div>
      </div>

      {/* Summary */}
      <div className="p-5 border-b border-ink-700/50">
        <div className="text-ink-400 uppercase mb-2" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
          关系概述
        </div>
        <p className="text-ink-200 leading-relaxed" style={{ fontSize: 13 }}>
          {edge.summary}
        </p>
      </div>

      {/* Literary note */}
      {edge.literaryNote && (
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-gold-dim" />
            <span className="text-ink-400 uppercase" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
              文学解读
            </span>
          </div>
          <p className="text-ink-300 leading-relaxed italic font-display" style={{ fontSize: 14 }}>
            {edge.literaryNote}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export function DetailPanel({ node, edge, characters, currentStage, onClose, perspectiveMode, onTogglePerspective, overrideScores, onScoreOverride, onResetOverride }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-700/50 flex-shrink-0">
        <div>
          <span className="text-ink-400 uppercase" style={{ fontSize: 9.5, letterSpacing: '0.18em' }}>
            {node ? '角色' : '关系'}
          </span>
          {currentStage && (
            <span className="ml-2 text-ink-600" style={{ fontSize: 9.5 }}>
              · {currentStage.zh}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-200 hover:bg-ink-700/50 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {node && (
          <NodeDetail
            node={node}
            perspectiveMode={perspectiveMode}
            onTogglePerspective={onTogglePerspective}
          />
        )}
        {edge && (
          <EdgeDetail
            edge={edge}
            characters={characters}
            overrideScores={overrideScores}
            onScoreOverride={onScoreOverride}
            onResetOverride={onResetOverride}
          />
        )}
      </div>
    </div>
  )
}
