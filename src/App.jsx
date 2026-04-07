import React, { useState, useCallback, useMemo } from 'react'
import {
  characters as sampleCharacters,
  relationships as sampleRelationships,
  STAGES,
} from './data/sampleData'
import { GraphCanvas }   from './components/GraphCanvas'
import { DetailPanel }   from './components/DetailPanel'
import { Timeline }      from './components/Timeline'
import { InsightCards }  from './components/InsightCards'
import { InputPanel }    from './components/InputPanel'
import { ModeToggle }    from './components/ModeToggle'
import { parseStoryText } from './utils/parser'
import { computeInsights } from './utils/insights'

// ── Hero intro ────────────────────────────────────────────────────────────────
function Hero({ onDismiss }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(5,6,10,0.96)', backdropFilter: 'blur(24px)' }}>
      <div className="max-w-lg px-8 py-10 text-center animate-float-in">
        {/* Ornament */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
          <span className="font-display text-gold/50 text-2xl">玉</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
        </div>

        <h1 className="font-display text-5xl font-light text-ink-50 mb-2" style={{ letterSpacing: '0.06em' }}>
          张力图谱
        </h1>
        <p className="font-display italic text-gold text-xl mb-8" style={{ letterSpacing: '0.08em' }}>
          逐玉 · 叙事智能
        </p>

        <p className="text-ink-300 leading-relaxed mb-6" style={{ fontSize: 15, lineHeight: 1.75 }}>
          可视化故事的情感几何。
        </p>
        <p className="text-ink-400 leading-relaxed mb-10" style={{ fontSize: 13.5, lineHeight: 1.8 }}>
          绘制人物之间的隐形力量——深情、猜忌、忠诚、背叛、权力与隐秘真相。
          观察关系如何随剧情推进而演变。
          感受故事为何如此触动人心。
        </p>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onDismiss}
            className="px-8 py-3 rounded-xl font-medium transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(232,184,109,0.18), rgba(196,144,80,0.12))',
              border: '1px solid rgba(232,184,109,0.4)',
              color: '#E8B86D',
              fontSize: 14,
              letterSpacing: '0.06em',
            }}
          >
            探索逐玉的情感世界 →
          </button>
          <p className="text-ink-600" style={{ fontSize: 11 }}>
            示例数据已预加载，点击任意角色或关系线即可开始。
          </p>
        </div>

        {/* Story capsule */}
        <div className="mt-10 pt-8 border-t border-ink-700/50">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '21', sub: '位角色' },
              { label: '20+', sub: '段关系' },
              { label: '5', sub: '个剧情阶段' },
            ].map(({ label, sub }) => (
              <div key={sub} className="text-center">
                <div className="font-display text-2xl text-gold/70">{label}</div>
                <div className="text-ink-500 text-xs tracking-widest mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [showHero,    setShowHero]    = useState(true)
  const [mode,        setMode]        = useState('emotional')
  const [stageIndex,  setStageIndex]  = useState(0)
  const [selNodeId,   setSelNodeId]   = useState(null)
  const [selEdgeId,   setSelEdgeId]   = useState(null)
  const [inputText,   setInputText]   = useState('')
  const [showInput,   setShowInput]   = useState(false)
  const [showInsights,setShowInsights]= useState(true)
  const [characters,  setCharacters]  = useState(sampleCharacters)
  const [relationships,setRelationships] = useState(sampleRelationships)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [overrideScores, setOverrideScores] = useState({})
  const [perspectiveCharId, setPerspectiveCharId] = useState(null)

  const currentStage = STAGES[stageIndex]

  // Hydrate characters with current-stage emotional state
  const currentCharacters = useMemo(() =>
    characters.map(c => ({
      ...c,
      currentEmotionalState: c.emotionalState?.[currentStage.id] ?? '',
    })),
  [characters, currentStage])

  // Hydrate relationships with current-stage scores + what-if overrides + cascade
  const currentRelationships = useMemo(() => {
    const base = relationships.map(r => ({
      ...r,
      ...(r.stages?.[currentStage.id] ?? {}),
      ...(overrideScores[r.id] ?? {}),
    }))
    // Cascade: for each overridden rel, apply 20% of delta to adjacent rels
    const cascade = {}
    Object.entries(overrideScores).forEach(([relId, overrides]) => {
      const baseRel = relationships.find(r => r.id === relId)
      if (!baseRel) return
      const baseStage = baseRel.stages?.[currentStage.id] ?? {}
      Object.entries(overrides).forEach(([key, val]) => {
        const delta = val - (baseStage[key] ?? 50)
        base.forEach(r => {
          if (r.id === relId) return
          if (r.source !== baseRel.source && r.target !== baseRel.source &&
              r.source !== baseRel.target && r.target !== baseRel.target) return
          if (!cascade[r.id]) cascade[r.id] = {}
          cascade[r.id][key] = (cascade[r.id][key] ?? 0) + delta * 0.2
        })
      })
    })
    return base.map(r => {
      const c = cascade[r.id]
      if (!c) return r
      const result = { ...r, _cascaded: true }
      Object.entries(c).forEach(([key, delta]) => {
        result[key] = Math.max(0, Math.min(100, (result[key] ?? 50) + delta))
      })
      return result
    })
  }, [relationships, currentStage, overrideScores])

  const insights = useMemo(() =>
    computeInsights(currentCharacters, currentRelationships, currentStage.id, mode),
  [currentCharacters, currentRelationships, currentStage.id, mode])

  const selectedNode = useMemo(() =>
    selNodeId ? currentCharacters.find(c => c.id === selNodeId) : null,
  [selNodeId, currentCharacters])

  const selectedEdge = useMemo(() =>
    selEdgeId ? currentRelationships.find(r => r.id === selEdgeId) : null,
  [selEdgeId, currentRelationships])

  const handleAnalyze = useCallback(() => {
    if (!inputText?.trim()) return
    setIsAnalyzing(true)
    // Simulated async — replace with real LLM call here
    setTimeout(() => {
      const parsed = parseStoryText(inputText)
      if (parsed.characters.length > 0) {
        setCharacters(parsed.characters)
        setRelationships(parsed.relationships)
      }
      setStageIndex(0)
      setSelNodeId(null)
      setSelEdgeId(null)
      setIsAnalyzing(false)
      setShowInput(false)
    }, 1100)
  }, [inputText])

  const handleLoadSample = useCallback(() => {
    setCharacters(sampleCharacters)
    setRelationships(sampleRelationships)
    setStageIndex(0)
    setSelNodeId(null)
    setSelEdgeId(null)
    setShowInput(false)
  }, [])

  const handleNodeSelect   = useCallback(id => { setSelNodeId(p => p === id ? null : id); setSelEdgeId(null)  }, [])
  const handleEdgeSelect   = useCallback(id => { setSelEdgeId(p => p === id ? null : id); setSelNodeId(null) }, [])
  const handleCloseDetail  = useCallback(() => { setSelNodeId(null); setSelEdgeId(null); setPerspectiveCharId(null) }, [])

  const handleScoreOverride = useCallback((relId, key, value) => {
    setOverrideScores(prev => ({
      ...prev,
      [relId]: { ...(prev[relId] ?? {}), [key]: value },
    }))
  }, [])

  const handleResetOverride = useCallback((relId) => {
    setOverrideScores(prev => {
      const next = { ...prev }
      delete next[relId]
      return next
    })
  }, [])

  const handleTogglePerspective = useCallback(() => {
    setPerspectiveCharId(prev => prev ? null : selNodeId)
  }, [selNodeId])

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0A0B10' }}>

      {/* ── Hero overlay ─────────────────────────────────────────────── */}
      {showHero && <Hero onDismiss={() => setShowHero(false)} />}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 z-10"
        style={{
          background: 'rgba(10,11,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(31,35,51,0.8)',
          minHeight: 56,
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setShowHero(true)}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-display text-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(232,184,109,0.2), rgba(196,144,80,0.08))',
              border: '1px solid rgba(232,184,109,0.3)',
              color: '#E8B86D',
            }}
          >
            玉
          </div>
          <div>
            <div className="font-display text-gold leading-tight group-hover:text-gold-bright transition-colors"
                 style={{ fontSize: 16, letterSpacing: '0.06em' }}>
              张力图谱
            </div>
            <div className="text-ink-500 uppercase leading-none"
                 style={{ fontSize: 8.5, letterSpacing: '0.22em' }}>
              逐玉 · 叙事智能
            </div>
          </div>
        </div>

        {/* Mode toggle — center */}
        <ModeToggle mode={mode} onModeChange={setMode} />

        {/* Controls — right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInput(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm"
            style={{
              background: showInput ? 'rgba(232,184,109,0.1)' : '#11131C',
              border: showInput ? '1px solid rgba(232,184,109,0.35)' : '1px solid #1F2333',
              color: showInput ? '#E8B86D' : '#555B7A',
              fontSize: 12,
            }}
          >
            {showInput ? '✕ 关闭' : '+ 输入文本'}
          </button>
          <button
            onClick={() => setShowInsights(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: '#11131C',
              border: '1px solid #1F2333',
              color: showInsights ? '#8A90AD' : '#363C57',
              fontSize: 12,
            }}
          >
            {showInsights ? '隐藏洞察' : '显示洞察'}
          </button>
        </div>
      </header>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Input panel */}
        {showInput && (
          <div
            className="w-72 flex-shrink-0 overflow-y-auto glass-panel-dark animate-float-in"
            style={{ borderRight: '1px solid rgba(31,35,51,0.8)' }}
          >
            <InputPanel
              text={inputText}
              onTextChange={setInputText}
              onAnalyze={handleAnalyze}
              onLoadSample={handleLoadSample}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {/* Graph canvas */}
        <div className="flex-1 relative min-w-0">
          <GraphCanvas
            characters={currentCharacters}
            relationships={currentRelationships}
            mode={mode}
            stageId={currentStage.id}
            selectedNodeId={selNodeId}
            selectedEdgeId={selEdgeId}
            onSelectNode={handleNodeSelect}
            onSelectEdge={handleEdgeSelect}
            perspectiveCharId={perspectiveCharId}
          />

          {/* Stage chip overlay */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <div
              className="px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(10,11,16,0.75)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(31,35,51,0.8)',
              }}
            >
              <div className="text-ink-500 uppercase leading-none mb-1" style={{ fontSize: 8.5, letterSpacing: '0.2em' }}>
                第 {stageIndex + 1} 幕 / {STAGES.length}
              </div>
              <div className="font-display text-ink-200 leading-tight" style={{ fontSize: 15 }}>
                {currentStage.label}
              </div>
              <div className="font-display text-gold/55 leading-none mt-0.5" style={{ fontSize: 13 }}>
                {currentStage.zh}
              </div>
            </div>
          </div>

          {/* Instruction hint */}
          {!selNodeId && !selEdgeId && (
            <div
              className="absolute bottom-4 left-1/2 pointer-events-none"
              style={{ transform: 'translateX(-50%)' }}
            >
              <div
                className="px-4 py-2 rounded-full text-ink-500"
                style={{
                  background: 'rgba(10,11,16,0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(31,35,51,0.6)',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                点击角色或关系线查看详情  ·  拖动节点重新排列
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {(selectedNode || selectedEdge) && (
          <div
            className="w-72 flex-shrink-0 overflow-y-auto glass-panel-dark animate-float-in"
            style={{ borderLeft: '1px solid rgba(31,35,51,0.8)' }}
          >
            <DetailPanel
              node={selectedNode}
              edge={selectedEdge}
              characters={currentCharacters}
              currentStage={currentStage}
              onClose={handleCloseDetail}
              perspectiveMode={perspectiveCharId === selNodeId && selNodeId !== null}
              onTogglePerspective={handleTogglePerspective}
              overrideScores={overrideScores}
              onScoreOverride={handleScoreOverride}
              onResetOverride={handleResetOverride}
            />
          </div>
        )}
      </div>

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-5 py-4"
        style={{
          background: 'rgba(10,11,16,0.85)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(31,35,51,0.7)',
        }}
      >
        <Timeline stages={STAGES} currentIndex={stageIndex} onChange={setStageIndex} />
      </div>

      {/* ── Insight cards ─────────────────────────────────────────────── */}
      {showInsights && (
        <div
          className="flex-shrink-0 px-5 pt-3 pb-4"
          style={{
            background: 'rgba(8,9,14,0.9)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(31,35,51,0.5)',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <InsightCards insights={insights} />
        </div>
      )}
    </div>
  )
}
