// ─────────────────────────────────────────────────────────────────────────────
// Mock Parser — extracts narrative structure from pasted text
// Replace the body of parseStoryText() with a real LLM call for V2.
// The return shape must remain identical so the rest of the app is unaffected.
// ─────────────────────────────────────────────────────────────────────────────

import { characters as sampleCharacters, relationships as sampleRelationships } from '../data/sampleData'

// Known character name fragments → sample character id
const NAME_MAP = {
  '樊长玉': 'fanchangyu',
  '长玉':   'fanchangyu',
  '谢征':   'xiezheng',
  '谢 征':  'xiezheng',
  '樊长宁': 'fanchangning',
  '长宁':   'fanchangning',
  '宋砚':   'songyan',
  '谢临山': 'xielinshan',
  '临山':   'xielinshan',
  '李怀安': 'lihuaian',
}

// Guess relationship type from surrounding words
const TYPE_HINTS = [
  { keywords: ['背叛', '抛弃', '离弃', '退婚', '辜负'], type: 'betrayal' },
  { keywords: ['爱', '情', '深情', '喜欢', '倾心', '爱慕', '爱人', '夫妻', '婚'], type: 'affection' },
  { keywords: ['信任', '依赖', '托付', '相信', '信赖'], type: 'trust' },
  { keywords: ['仇', '敌', '对立', '冲突', '对抗', '仇恨', '报仇'], type: 'conflict' },
  { keywords: ['权臣', '政治', '威胁', '幕后', '手段', '毒辣'], type: 'political_threat' },
  { keywords: ['忠诚', '效忠', '誓言', '忠心', '护', '保护'], type: 'loyalty' },
  { keywords: ['责任', '职责', '使命', '义务', '任务'], type: 'duty' },
  { keywords: ['依存', '依靠', '倚仗', '依附'], type: 'dependence' },
  { keywords: ['秘密', '隐瞒', '真相', '身份', '隐藏', '掩护'], type: 'hidden_truth' },
]

function guessRelationshipType(sentenceContext) {
  for (const { keywords, type } of TYPE_HINTS) {
    if (keywords.some(kw => sentenceContext.includes(kw))) return type
  }
  return 'trust'
}

/**
 * V1 mock parser.
 * Finds known character names in text, infers which sample characters are present,
 * and returns a filtered + lightly customised subset of the sample dataset.
 *
 * For V2: replace everything inside with an LLM API call that returns the same shape.
 */
export function parseStoryText(text) {
  if (!text || text.trim().length < 20) {
    return { characters: [], relationships: [] }
  }

  // Step 1 — detect which sample characters appear in the text
  const foundIds = new Set()
  for (const [fragment, id] of Object.entries(NAME_MAP)) {
    if (text.includes(fragment)) foundIds.add(id)
  }

  if (foundIds.size === 0) {
    // No known names — fall back to full sample dataset with a note
    return { characters: sampleCharacters, relationships: sampleRelationships }
  }

  const detectedChars = sampleCharacters.filter(c => foundIds.has(c.id))

  // Step 2 — filter relationships to only those between detected characters
  const detectedRels = sampleRelationships
    .filter(r => foundIds.has(r.source) && foundIds.has(r.target))
    .map(rel => {
      // Lightly adjust tension based on keyword density in text
      const sentences = text.split(/[。！？\n]/)
      const srcChar = sampleCharacters.find(c => c.id === rel.source)
      const tgtChar = sampleCharacters.find(c => c.id === rel.target)
      const relevantSentences = sentences.filter(
        s => (srcChar && (s.includes(srcChar.name) || s.includes(srcChar.nameEn)))
          && (tgtChar && (s.includes(tgtChar.name) || s.includes(tgtChar.nameEn)))
      ).join(' ')

      const guessedType = relevantSentences
        ? guessRelationshipType(relevantSentences)
        : rel.primaryType

      // Slightly modulate scores — in V2 the LLM does this properly
      const noise = () => Math.floor((Math.random() - 0.5) * 10)
      return {
        ...rel,
        primaryType: guessedType,
        stages: Object.fromEntries(
          Object.entries(rel.stages).map(([stageId, scores]) => [
            stageId,
            {
              tensionScore:  Math.max(0, Math.min(100, scores.tensionScore  + noise())),
              trustScore:    Math.max(0, Math.min(100, scores.trustScore    + noise())),
              affectionScore:Math.max(0, Math.min(100, scores.affectionScore+ noise())),
              powerScore:    Math.max(0, Math.min(100, scores.powerScore    + noise())),
            },
          ])
        ),
      }
    })

  return { characters: detectedChars, relationships: detectedRels }
}
