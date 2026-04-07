import React, {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react'

// Tracks which avatarUrls failed to load so we fall back to color nodes
const avatarErrorCache = new Set()
import * as d3 from 'd3'
import { RELATIONSHIP_TYPES, bkimg } from '../data/sampleData'

// ── Layout constants ─────────────────────────────────────────────────────────
const BASE_RADIUS = 28
const WEIGHT_SCALE = 2.2

function nodeRadius(nw) {
  return BASE_RADIUS + Math.max(0, (nw - 5)) * WEIGHT_SCALE
}

function bezierPath(sx, sy, tx, ty, sr, tr) {
  const dx = tx - sx
  const dy = ty - sy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ox = sx + (dx / len) * sr
  const oy = sy + (dy / len) * sr
  const ex = tx - (dx / len) * tr
  const ey = ty - (dy / len) * tr
  const cx = (ox + ex) / 2 - (dy / len) * (len * 0.14)
  const cy = (oy + ey) / 2 + (dx / len) * (len * 0.14)
  return `M ${ox.toFixed(1)} ${oy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
}

function edgeStyle(rel, mode, isSelected, isHighlighted) {
  const t   = rel.tensionScore   ?? 50
  const tr  = rel.trustScore     ?? 50
  const pw  = rel.powerScore     ?? 50
  const imb = Math.abs(pw - 50) / 50

  const typeInfo = RELATIONSHIP_TYPES[rel.primaryType] ?? RELATIONSHIP_TYPES.trust
  let width, opacity, color, dashArray, pulse

  if (mode === 'emotional') {
    width   = 1.2 + (t / 100) * 5.5
    opacity = 0.28 + (t / 100) * 0.65
    color   = typeInfo.color
    dashArray = typeInfo.dashArray
    pulse   = t > 78
  } else if (mode === 'loyalty') {
    const loyalTypes = ['loyalty', 'duty', 'betrayal']
    const relevant   = loyalTypes.includes(rel.primaryType)
    const score = rel.primaryType === 'betrayal' ? 100 - tr : tr
    width   = 1.2 + (score / 100) * 4.5
    opacity = relevant ? 0.45 + (score / 100) * 0.5 : 0.10
    color   = typeInfo.color
    dashArray = typeInfo.dashArray
    pulse   = rel.primaryType === 'betrayal' && score > 55
  } else {
    width   = 1.2 + imb * 6
    opacity = 0.28 + imb * 0.65
    color   = pw > 50 ? '#C44F4F' : '#4A8CC4'
    dashArray = null
    pulse   = imb > 0.45
  }

  if (isSelected) { width *= 1.6; opacity = Math.min(1, opacity * 1.4) }
  else if (isHighlighted) { opacity = Math.min(1, opacity * 1.25) }

  return { width, opacity, color, dashArray, pulse }
}

// ── Predefined initial positions (0-1 of container) ──────────────────────────
const INITIAL_POS = {
  fanchangyu:    [0.48, 0.48],
  xiezheng:     [0.64, 0.36],
  fanchangning:  [0.30, 0.36],
  songyan:      [0.22, 0.60],
  xielinshan:   [0.76, 0.60],
  lihuaian:     [0.50, 0.11],
  yuyuanqian:   [0.76, 0.46],
  suiyuanqing:  [0.68, 0.72],
  qimin:        [0.82, 0.24],
  gongsundan:   [0.28, 0.72],
  qizhu:        [0.36, 0.84],
  zhaodaniang:  [0.18, 0.44],
  weiyan:       [0.62, 0.12],
  zhaodashu:    [0.14, 0.56],
  wangbutou:    [0.18, 0.70],
  changxinwang: [0.88, 0.36],
  weiwan:       [0.72, 0.20],
  chengdetaizi: [0.46, 0.06],
  xiandi:       [0.34, 0.10],
  taotaifu:     [0.54, 0.22],
  antaifei:     [0.24, 0.20],
}

export function GraphCanvas({
  characters,
  relationships,
  mode,
  stageId,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
  perspectiveCharId,
}) {
  const containerRef = useRef(null)
  const svgRef       = useRef(null)
  const bgRectRef    = useRef(null)

  const [dims, setDims]             = useState({ w: 800, h: 580 })
  const dimsRef                     = useRef({ w: 800, h: 580 })
  const [positions, setPositions]   = useState({})
  const [hoverNode, setHoverNode]   = useState(null)
  const [hoverEdge, setHoverEdge]   = useState(null)
  const [avatarErrors, setAvatarErrors] = useState(new Set())

  const simRef    = useRef(null)
  const nodesRef  = useRef([])
  const dragRef   = useRef(null)
  const isDragRef = useRef(false)

  // ── View transform (zoom / pan) ────────────────────────────────────────────
  const [vt, setVt]  = useState({ tx: 0, ty: 0, scale: 1 })
  const vtRef        = useRef({ tx: 0, ty: 0, scale: 1 })
  const panRef       = useRef(null)

  const applyVt = useCallback((next) => {
    vtRef.current = next
    setVt(next)
  }, [])

  // ── Legend state ───────────────────────────────────────────────────────────
  const [legendCollapsed, setLegendCollapsed] = useState(false)
  const [legendPos, setLegendPos]             = useState(null) // null = default CSS position
  const legendDragRef                         = useRef(null)

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const d = { w: Math.max(400, width), h: Math.max(300, height) }
      setDims(d)
      dimsRef.current = d
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // ── Wheel zoom ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const { tx, ty, scale } = vtRef.current
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newScale = Math.max(0.12, Math.min(5, scale * factor))
      applyVt({
        tx: mx - (mx - tx) * (newScale / scale),
        ty: my - (my - ty) * (newScale / scale),
        scale: newScale,
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [applyVt])

  // ── Force simulation ───────────────────────────────────────────────────────
  useEffect(() => {
    const { w, h } = dims
    if (w === 0 || h === 0) return

    const prevPos = nodesRef.current.reduce((acc, n) => {
      acc[n.id] = { x: n.x, y: n.y }; return acc
    }, {})

    const nodes = characters.map(c => {
      const prev = prevPos[c.id]
      const init = INITIAL_POS[c.id] ?? [0.5, 0.5]
      return {
        id: c.id,
        narrativeWeight: c.narrativeWeight,
        x: prev?.x ?? w * init[0],
        y: prev?.y ?? h * init[1],
      }
    })
    nodesRef.current = nodes

    const links = relationships.map(r => ({
      id: r.id,
      source: r.source,
      target: r.target,
      dist: 155 + (100 - (r.tensionScore ?? 50)) * 0.75,
    }))

    if (simRef.current) simRef.current.stop()

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id)
        .distance(d => d.dist).strength(0.22))
      .force('charge', d3.forceManyBody().strength(-340))
      .force('center', d3.forceCenter(w / 2, h / 2).strength(0.04))
      .force('collision', d3.forceCollide().radius(d => nodeRadius(d.narrativeWeight) + 28))
      .alpha(0.55)
      .alphaDecay(0.024)

    sim.on('tick', () => {
      const pos = {}
      nodes.forEach(n => {
        const r = nodeRadius(n.narrativeWeight) + 12
        n.x = Math.max(r, Math.min(w - r, n.x))
        n.y = Math.max(r, Math.min(h - r, n.y))
        pos[n.id] = { x: n.x, y: n.y }
      })
      setPositions({ ...pos })
    })

    simRef.current = sim
    return () => sim.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, dims])

  useEffect(() => {
    const sim = simRef.current
    if (!sim) return
    const links = relationships.map(r => ({
      id: r.id,
      source: r.source,
      target: r.target,
      dist: 155 + (100 - (r.tensionScore ?? 50)) * 0.75,
    }))
    sim.force('link').links(links)
    sim.alpha(0.28).restart()
  }, [stageId, relationships])

  // ── SVG pan handlers ───────────────────────────────────────────────────────
  const onSvgPointerDown = useCallback((e) => {
    if (e.target !== bgRectRef.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    panRef.current = {
      startX: e.clientX, startY: e.clientY,
      startTx: vtRef.current.tx, startTy: vtRef.current.ty,
    }
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing'
  }, [])

  const onSvgPointerMove = useCallback((e) => {
    if (!panRef.current) return
    const dx = e.clientX - panRef.current.startX
    const dy = e.clientY - panRef.current.startY
    applyVt({ ...vtRef.current, tx: panRef.current.startTx + dx, ty: panRef.current.startTy + dy })
  }, [applyVt])

  const onSvgPointerUp = useCallback((e) => {
    if (!panRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    panRef.current = null
    if (svgRef.current) svgRef.current.style.cursor = 'default'
  }, [])

  // ── Node drag ──────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e, id) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragRef.current = false
    dragRef.current   = { id, startX: e.clientX, startY: e.clientY }
    const node = nodesRef.current.find(n => n.id === id)
    if (node) { node.fx = node.x; node.fy = node.y }
    simRef.current?.alpha(0.1).restart()
  }, [])

  const onPointerMove = useCallback((e, id) => {
    if (!dragRef.current || dragRef.current.id !== id) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isDragRef.current = true
    if (!isDragRef.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    // Convert screen coords → graph coords (account for zoom/pan transform)
    const { tx, ty, scale } = vtRef.current
    const graphX = (e.clientX - rect.left - tx) / scale
    const graphY = (e.clientY - rect.top  - ty) / scale
    const node = nodesRef.current.find(n => n.id === id)
    if (node) { node.fx = graphX; node.fy = graphY }
    simRef.current?.alpha(0.08).restart()
  }, [])

  const onPointerUp = useCallback((e, id) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!isDragRef.current) onSelectNode(id)
    const node = nodesRef.current.find(n => n.id === id)
    if (node) { node.fx = null; node.fy = null }
    isDragRef.current = false
    dragRef.current   = null
  }, [onSelectNode])

  // ── Zoom controls ──────────────────────────────────────────────────────────
  const zoomBy = useCallback((factor) => {
    const { tx, ty, scale } = vtRef.current
    const { w, h } = dimsRef.current
    const cx = w / 2, cy = h / 2
    const newScale = Math.max(0.12, Math.min(5, scale * factor))
    applyVt({
      tx: cx - (cx - tx) * (newScale / scale),
      ty: cy - (cy - ty) * (newScale / scale),
      scale: newScale,
    })
  }, [applyVt])

  const resetZoom = useCallback(() => applyVt({ tx: 0, ty: 0, scale: 1 }), [applyVt])

  // ── Legend drag ────────────────────────────────────────────────────────────
  const onLegendDragStart = useCallback((e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const legendEl = e.currentTarget.closest('[data-legend]')
    const containerRect = containerRef.current?.getBoundingClientRect()
    const legendRect    = legendEl?.getBoundingClientRect()
    if (!containerRect || !legendRect) return
    legendDragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startLeft: legendRect.left - containerRect.left,
      startTop:  legendRect.top  - containerRect.top,
    }
  }, [])

  const onLegendDragMove = useCallback((e) => {
    if (!legendDragRef.current) return
    const { w, h } = dimsRef.current
    const dx = e.clientX - legendDragRef.current.startX
    const dy = e.clientY - legendDragRef.current.startY
    setLegendPos({
      left: Math.max(0, Math.min(w - 180, legendDragRef.current.startLeft + dx)),
      top:  Math.max(0, Math.min(h - 40,  legendDragRef.current.startTop  + dy)),
    })
  }, [])

  const onLegendDragEnd = useCallback((e) => {
    if (!legendDragRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    legendDragRef.current = null
  }, [])

  // ── Edge render data ───────────────────────────────────────────────────────
  const edgeData = useMemo(() => relationships.map(rel => {
    const sp = positions[rel.source] ?? { x: 0, y: 0 }
    const tp = positions[rel.target] ?? { x: 0, y: 0 }
    const sc = characters.find(c => c.id === rel.source)
    const tc = characters.find(c => c.id === rel.target)
    const sr = nodeRadius(sc?.narrativeWeight ?? 5) + 2
    const tr = nodeRadius(tc?.narrativeWeight ?? 5) + 2
    const path = bezierPath(sp.x, sp.y, tp.x, tp.y, sr, tr)
    const isSel = selectedEdgeId === rel.id
    const isHi  = !!(
      hoverEdge === rel.id ||
      selectedNodeId === rel.source || selectedNodeId === rel.target ||
      hoverNode === rel.source || hoverNode === rel.target
    )
    const style = edgeStyle(rel, mode, isSel, isHi)
    if (perspectiveCharId && rel.source !== perspectiveCharId && rel.target !== perspectiveCharId) {
      style.opacity *= 0.08
    }
    if (rel._cascaded) {
      style.width *= 1.3
      style.cascadeGlow = true
    }
    const midX  = (sp.x + tp.x) / 2 + ((tp.y - sp.y) * 0.07)
    const midY  = (sp.y + tp.y) / 2 - ((tp.x - sp.x) * 0.07)
    return { ...rel, path, style, midX, midY, isSel, isHi }
  }), [relationships, positions, mode, selectedEdgeId, selectedNodeId, hoverEdge, hoverNode, characters, perspectiveCharId])

  const { w, h } = dims

  const legendStyle = legendPos
    ? { position: 'absolute', left: legendPos.left, top: legendPos.top }
    : { position: 'absolute', bottom: 16, right: 16 }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <svg
        ref={svgRef}
        width={w} height={h}
        className="absolute inset-0 select-none"
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
      >
        <defs>
          <filter id="glow-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <filter id="glow-text" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>

          {characters.map(c => (
            <radialGradient key={c.id} id={`ng-${c.id}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%"   stopColor={c.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={c.color} stopOpacity="0.06" />
            </radialGradient>
          ))}
          {characters.map(c => (
            <radialGradient key={`sel-${c.id}`} id={`ngs-${c.id}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%"   stopColor={c.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={c.color} stopOpacity="0.12" />
            </radialGradient>
          ))}
          {characters.map(c => {
            const r = nodeRadius(c.narrativeWeight)
            return (
              <clipPath key={`clip-${c.id}`} id={`clip-${c.id}`}>
                <circle cx="0" cy="0" r={r - 2} />
              </clipPath>
            )
          })}

          <pattern id="dotgrid" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#1F2333" opacity="0.6" />
          </pattern>
        </defs>

        {/* Background — outside transform so it always fills the viewport */}
        <rect ref={bgRectRef} width={w} height={h} fill="url(#dotgrid)" style={{ cursor: 'grab' }} />

        {/* Transformed content */}
        <g transform={`translate(${vt.tx.toFixed(2)},${vt.ty.toFixed(2)}) scale(${vt.scale.toFixed(4)})`}>
          {/* ── Edges ───────────────────────────────────────────────────── */}
          <g>
            {edgeData.map(edge => (
              <g key={edge.id}>
                {edge.style.cascadeGlow && (
                  <path
                    d={edge.path}
                    fill="none"
                    stroke="#9B6CF6"
                    strokeWidth={edge.style.width * 4}
                    opacity={0.12}
                    strokeLinecap="round"
                    style={{ animation: 'edgePulse 2s ease-in-out infinite' }}
                  />
                )}
                <path
                  d={edge.path}
                  fill="none"
                  stroke={edge.style.color}
                  strokeWidth={edge.style.width * 3.5}
                  opacity={edge.style.opacity * 0.15}
                  strokeLinecap="round"
                />
                <path
                  d={edge.path}
                  fill="none"
                  stroke={edge.style.color}
                  strokeWidth={edge.style.width}
                  opacity={edge.style.opacity}
                  strokeLinecap="round"
                  strokeDasharray={
                    edge.style.pulse
                      ? '6 6'
                      : edge.style.dashArray ?? undefined
                  }
                  style={{
                    transition: 'stroke-width 0.4s ease, opacity 0.4s ease',
                    animation: edge.style.pulse
                      ? 'dashFlow 1.8s linear infinite, edgePulse 2.5s ease-in-out infinite'
                      : undefined,
                  }}
                />
                <path
                  d={edge.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(14, edge.style.width + 10)}
                  className="cursor-pointer"
                  onClick={e => { e.stopPropagation(); onSelectEdge(edge.id) }}
                  onMouseEnter={() => setHoverEdge(edge.id)}
                  onMouseLeave={() => setHoverEdge(null)}
                />
                {(edge.isSel || edge.isHi) && (
                  <g transform={`translate(${edge.midX.toFixed(1)},${edge.midY.toFixed(1)})`}
                     style={{ animation: 'floatIn 0.25s ease-out' }}>
                    <rect
                      x={-44} y={-13} width={88} height={24}
                      rx={5}
                      fill="#0A0B10"
                      stroke={edge.style.color}
                      strokeWidth={0.8}
                      opacity={0.92}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={edge.style.color}
                      fontSize={11}
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      letterSpacing="0.02em"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </g>

          {/* ── Nodes ───────────────────────────────────────────────────── */}
          <g>
            {characters.map(char => {
              const pos   = positions[char.id] ?? { x: 0, y: 0 }
              const r     = nodeRadius(char.narrativeWeight)
              const isSel = selectedNodeId === char.id
              const isHov = hoverNode === char.id
              const isConn = !!(selectedNodeId && relationships.some(rel =>
                (rel.source === char.id && rel.target === selectedNodeId) ||
                (rel.target === char.id && rel.source === selectedNodeId)
              ))

              const isPerspective = !!perspectiveCharId
              const isPerspeciveChar = char.id === perspectiveCharId
              const connectedToPerspective = isPerspective && relationships.some(r =>
                (r.source === perspectiveCharId && r.target === char.id) ||
                (r.target === perspectiveCharId && r.source === char.id)
              )

              const isDim = isPerspective
                ? (!isPerspeciveChar && !connectedToPerspective)
                : !!(selectedNodeId && !isSel && !isConn)

              let perspectiveStrokeColor = char.color
              if (isPerspective && connectedToPerspective && !isPerspeciveChar) {
                const rel = relationships.find(r =>
                  (r.source === perspectiveCharId && r.target === char.id) ||
                  (r.target === perspectiveCharId && r.source === char.id)
                )
                const trust = rel?.trustScore ?? 50
                const type = rel?.primaryType ?? 'trust'
                if (type === 'conflict' || type === 'betrayal' || type === 'political_threat') {
                  perspectiveStrokeColor = '#C44F4F'
                } else if (trust > 65) {
                  perspectiveStrokeColor = '#4CAF8B'
                } else if (trust < 35) {
                  perspectiveStrokeColor = '#E0602B'
                }
              }

              return (
                <g
                  key={char.id}
                  transform={`translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)})`}
                  className="cursor-grab active:cursor-grabbing"
                  style={{
                    opacity: isDim ? 0.22 : 1,
                    transition: 'opacity 0.35s ease',
                  }}
                  onPointerDown={e => onPointerDown(e, char.id)}
                  onPointerMove={e => onPointerMove(e, char.id)}
                  onPointerUp={e   => onPointerUp(e, char.id)}
                  onMouseEnter={() => setHoverNode(char.id)}
                  onMouseLeave={() => setHoverNode(null)}
                >
                  {isSel && (
                    <>
                      <circle r={r + 16} fill="none" stroke={char.color} strokeWidth={1}
                        opacity={0.25} style={{ animation: 'ringPulse 2.2s ease-in-out infinite' }} />
                      <circle r={r + 9}  fill="none" stroke={char.color} strokeWidth={1.5}
                        opacity={0.45} style={{ animation: 'ringPulse 2.2s ease-in-out infinite 0.4s' }} />
                    </>
                  )}
                  {(isHov && !isSel) && (
                    <circle r={r + 8} fill="none" stroke={char.color} strokeWidth={1} opacity={0.3} />
                  )}
                  <circle r={r + 5} fill={char.color}
                    opacity={isSel ? 0.18 : isHov ? 0.10 : 0.05}
                    filter="url(#glow-soft)"
                    style={{ transition: 'opacity 0.25s ease' }}
                  />
                  <circle r={r}
                    fill={isSel ? `url(#ngs-${char.id})` : `url(#ng-${char.id})`}
                    stroke={perspectiveStrokeColor}
                    strokeWidth={isSel ? 2.4 : isHov ? 2 : 1.5}
                    opacity={isHov || isSel ? 1 : 0.92}
                    style={{ transition: 'stroke-width 0.2s ease' }}
                  />
                  {char.avatarUrl && !avatarErrors.has(char.id) && (
                    <image
                      href={bkimg(char.avatarUrl)}
                      x={-r + 2} y={-r + 2}
                      width={(r - 2) * 2} height={(r - 2) * 2}
                      clipPath={`url(#clip-${char.id})`}
                      preserveAspectRatio="xMidYMid slice"
                      opacity={isHov || isSel ? 1 : 0.88}
                      style={{ transition: 'opacity 0.2s ease' }}
                      onError={() => setAvatarErrors(prev => new Set([...prev, char.id]))}
                    />
                  )}
                  <circle r={r} fill="none" stroke={perspectiveStrokeColor}
                    strokeWidth={isSel ? 2.4 : isHov ? 2 : 1.5}
                    style={{ transition: 'stroke-width 0.2s ease' }}
                  />
                  <circle
                    cx={r * 0.68} cy={r * 0.68} r={5}
                    fill={char.color}
                    opacity={isSel ? 1 : 0.75}
                    stroke="#0A0B10" strokeWidth={1.5}
                    style={{ transition: 'opacity 0.2s ease' }}
                  />
                  <text
                    y={r + 18}
                    textAnchor="middle"
                    fill={isSel ? char.color : '#CDD0E0'}
                    fontSize={15}
                    fontWeight={isSel ? '600' : '400'}
                    fontFamily='"Cormorant Garamond", Georgia, serif'
                    letterSpacing="0.05em"
                    style={{ transition: 'fill 0.2s ease', pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {char.name}
                  </text>
                  {char.actor && (
                    <text
                      y={r + 31}
                      textAnchor="middle"
                      fill={isSel ? `${char.color}CC` : '#9AA0BA'}
                      fontSize={9.5}
                      fontFamily="Inter, sans-serif"
                      letterSpacing="0.08em"
                      style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s ease' }}
                    >
                      {char.actor}
                    </text>
                  )}
                  <text
                    y={r + (char.actor ? 43 : 32)}
                    textAnchor="middle"
                    fill={isSel ? `${char.color}99` : '#6B7290'}
                    fontSize={9}
                    fontFamily="Inter, sans-serif"
                    letterSpacing="0.12em"
                    style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.2s ease' }}
                  >
                    {char.role}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      </svg>

      {/* ── Zoom controls ─────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-4 left-4 flex flex-col gap-1"
        style={{ zIndex: 10 }}
      >
        <button
          onClick={() => zoomBy(1.25)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-200 hover:text-ink-50 transition-colors"
          style={{ background: 'rgba(17,19,28,0.85)', border: '1px solid rgba(54,60,87,0.5)', fontSize: 18, lineHeight: 1 }}
          title="放大"
        >+</button>
        <button
          onClick={() => zoomBy(1 / 1.25)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-200 hover:text-ink-50 transition-colors"
          style={{ background: 'rgba(17,19,28,0.85)', border: '1px solid rgba(54,60,87,0.5)', fontSize: 22, lineHeight: 1 }}
          title="缩小"
        >−</button>
        <button
          onClick={resetZoom}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-200 transition-colors"
          style={{ background: 'rgba(17,19,28,0.85)', border: '1px solid rgba(54,60,87,0.5)', fontSize: 9, letterSpacing: '0.04em' }}
          title="重置视图"
        >重置</button>
        {/* Zoom level indicator */}
        <div
          className="text-center text-ink-500"
          style={{ fontSize: 9, letterSpacing: '0.04em' }}
        >
          {Math.round(vt.scale * 100)}%
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div
        data-legend="true"
        className="glass-panel rounded-xl text-xs"
        style={{
          ...legendStyle,
          zIndex: 10,
          minWidth: legendCollapsed ? 'auto' : 160,
          userSelect: 'none',
        }}
      >
        {/* Header / drag handle */}
        <div
          className="flex items-center justify-between px-3 py-2.5 cursor-move"
          style={{ borderBottom: legendCollapsed ? 'none' : '1px solid rgba(54,60,87,0.4)' }}
          onPointerDown={onLegendDragStart}
          onPointerMove={onLegendDragMove}
          onPointerUp={onLegendDragEnd}
        >
          <span className="text-ink-400 uppercase" style={{ fontSize: 9, letterSpacing: '0.18em' }}>
            关系类型
          </span>
          <button
            onClick={e => { e.stopPropagation(); setLegendCollapsed(v => !v) }}
            className="ml-3 text-ink-500 hover:text-ink-200 transition-colors flex-shrink-0"
            style={{ fontSize: 13, lineHeight: 1, width: 16, textAlign: 'center' }}
          >
            {legendCollapsed ? '+' : '−'}
          </button>
        </div>

        {/* Body */}
        {!legendCollapsed && (
          <div className="px-3 py-2.5">
            <div className="space-y-2">
              {Object.entries(RELATIONSHIP_TYPES).map(([key, type]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <svg width="26" height="6" className="flex-shrink-0">
                    <line x1="1" y1="3" x2="25" y2="3"
                      stroke={type.color} strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={type.dashArray ?? undefined}
                    />
                  </svg>
                  <span className="text-ink-200" style={{ fontSize: 11 }}>{type.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2.5 border-t border-ink-600/40 text-ink-400 leading-relaxed" style={{ fontSize: 9.5 }}>
              节点大小 = 叙事权重<br />
              线条宽度 = 张力强度<br />
              拖动节点重新排列
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
