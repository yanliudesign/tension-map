// ─────────────────────────────────────────────────────────────────────────────
// Insight Engine — computes narrative insight cards from current graph state
// In V2: augment these with real LLM-generated prose for each card.
// ─────────────────────────────────────────────────────────────────────────────

const LITERARY_PHRASES = {
  tension_high:  ['克制的信任在重压下崩塌', '被命运武器化的未竟之情', '悬而未决的敌意濒临决裂'],
  tension_low:   ['谨慎的靠近', '静默的共存', '没有和解的停战'],
  trust_low:     ['亲密之下的不信任', '必要隐瞒的代价', '忠诚被拉扯至断裂边缘'],
  power_high:    ['脆弱性的极度不对等', '一方掌握着另一方的生死', '依存的代数'],
  affection_high:['爱，作为求生的意外盈余', '温柔延续于最初的缘由消散之后', '感情在获得许可之前便已抵达'],
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getCharName(id, characters) {
  return characters.find(c => c.id === id)?.name ?? id
}

function getRelLabel(rel) {
  return rel.labelEn ?? rel.label ?? rel.id
}

// ── Individual insight generators ─────────────────────────────────────────────

function insightHighestTension(chars, rels) {
  const top = [...rels].sort((a, b) => b.tensionScore - a.tensionScore)[0]
  if (!top) return null
  const a = getCharName(top.source, chars)
  const b = getCharName(top.target, chars)
  return {
    id: 'highest_tension',
    title: '情感张力最高',
    icon: 'Flame',
    accent: '#E8B86D',
    value: top.tensionScore,
    body: `${a} × ${b} — ${pick(LITERARY_PHRASES.tension_high)}。张力值：${top.tensionScore}。`,
    pair: `${a} × ${b}`,
  }
}

function insightHiddenTruth(chars, rels) {
  const candidates = rels.filter(r =>
    r.types?.includes('hidden_truth') || r.primaryType === 'hidden_truth'
  )
  if (!candidates.length) {
    // Fallback: lowest trust score
    const top = [...rels].sort((a, b) => a.trustScore - b.trustScore)[0]
    if (!top) return null
    const a = getCharName(top.source, chars)
    const b = getCharName(top.target, chars)
    return {
      id: 'hidden_truth',
      title: '最深的隐秘真相',
      icon: 'EyeOff',
      accent: '#9B6CF6',
      value: 100 - top.trustScore,
      body: `${a} × ${b} — ${pick(LITERARY_PHRASES.trust_low)}。信任值：${top.trustScore}。`,
      pair: `${a} × ${b}`,
    }
  }
  const top = candidates.sort((a, b) => b.tensionScore - a.tensionScore)[0]
  const a = getCharName(top.source, chars)
  const b = getCharName(top.target, chars)
  return {
    id: 'hidden_truth',
    title: 'Strongest Hidden Truth',
    icon: 'EyeOff',
    accent: '#9B6CF6',
    value: top.tensionScore,
    body: `${a} 藏着一个 ${b} 尚未得知的真相 — ${pick(LITERARY_PHRASES.trust_low)}。`,
    pair: `${a} × ${b}`,
  }
}

function insightAsymmetric(chars, rels) {
  const top = [...rels].sort((a, b) =>
    Math.abs(b.powerScore - 50) - Math.abs(a.powerScore - 50)
  )[0]
  if (!top) return null
  const a = getCharName(top.source, chars)
  const b = getCharName(top.target, chars)
  const dominant = top.powerScore > 50 ? a : b
  const imbalance = Math.abs(top.powerScore - 50)
  return {
    id: 'asymmetric',
    title: '权力最不对等的关系',
    icon: 'Scale',
    accent: '#E0602B',
    value: imbalance * 2,
    body: `${a} × ${b} — ${pick(LITERARY_PHRASES.power_high)}。${dominant} 掌握着压倒性的结构性权力。`,
    pair: `${a} × ${b}`,
  }
}

function insightPressure(chars, rels) {
  // Character with highest sum of tension across all their relationships
  const scores = {}
  chars.forEach(c => { scores[c.id] = 0 })
  rels.forEach(r => {
    if (scores[r.source] !== undefined) scores[r.source] += r.tensionScore
    if (scores[r.target] !== undefined) scores[r.target] += r.tensionScore
  })
  const topId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0]
  if (!topId) return null
  const char = chars.find(c => c.id === topId)
  return {
    id: 'pressure',
    title: '承受压力最大的角色',
    icon: 'AlertTriangle',
    accent: '#C44F4F',
    value: Math.min(100, Math.round(scores[topId] / (rels.length || 1))),
    body: `${char?.name} 处于所有高张力线的交汇处——是故事旋转所围绕的${pick(['轴心', '支点', '伤口'])}。`,
    pair: char?.name,
  }
}

function insightLikelyFracture(chars, rels) {
  // Relationship with high tension but low trust
  const scored = rels.map(r => ({
    ...r,
    fractureScore: r.tensionScore * (1 - r.trustScore / 100),
  }))
  const top = scored.sort((a, b) => b.fractureScore - a.fractureScore)[0]
  if (!top) return null
  const a = getCharName(top.source, chars)
  const b = getCharName(top.target, chars)
  return {
    id: 'likely_fracture',
    title: '最易决裂的关系',
    icon: 'Zap',
    accent: '#DC7070',
    value: Math.round(top.fractureScore),
    body: `${a} × ${b} — 高张力，低信任。${pick(['决裂不是"是否"的问题，而是"何时"的问题', '每一次对话都是与崩溃的谈判', '这段关系承重已久，裂缝早已深入'])}.`,
    pair: `${a} × ${b}`,
  }
}

function insightEmotionalCenter(chars, rels) {
  // Character with highest average affection score across relationships
  const scores = {}
  const counts = {}
  chars.forEach(c => { scores[c.id] = 0; counts[c.id] = 0 })
  rels.forEach(r => {
    if (scores[r.source] !== undefined) { scores[r.source] += r.affectionScore; counts[r.source]++ }
    if (scores[r.target] !== undefined) { scores[r.target] += r.affectionScore; counts[r.target]++ }
  })
  const avgs = Object.entries(scores).map(([id, s]) => ({
    id,
    avg: counts[id] > 0 ? s / counts[id] : 0,
  }))
  const top = avgs.sort((a, b) => b.avg - a.avg)[0]
  if (!top) return null
  const char = chars.find(c => c.id === top.id)
  return {
    id: 'emotional_center',
    title: '故事的情感中心',
    icon: 'Heart',
    accent: '#E8B86D',
    value: Math.round(top.avg),
    body: `${char?.name} — 故事中所有的情感线都穿过或指向他们。${pick(['失去他们，故事便失去引力', '他们不是最响亮的声音，却是故事存在的理由', '叙事的情感轨道以此为核心'])}.`,
    pair: char?.name,
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export function computeInsights(characters, relationships, _stageId, _mode) {
  const generators = [
    insightHighestTension,
    insightHiddenTruth,
    insightAsymmetric,
    insightPressure,
    insightLikelyFracture,
    insightEmotionalCenter,
  ]
  return generators
    .map(fn => fn(characters, relationships))
    .filter(Boolean)
}
