import React from 'react'
import { Sparkles, BookOpen, Trash2 } from 'lucide-react'
import { SAMPLE_INPUT_TEXT } from '../data/sampleData'

export function InputPanel({ text, onTextChange, onAnalyze, onLoadSample, isAnalyzing }) {
  return (
    <div className="h-full flex flex-col p-5 gap-4">
      {/* Header */}
      <div>
        <h3 className="font-display text-lg text-ink-100 mb-1">分析故事文本</h3>
        <p className="text-ink-400 leading-relaxed" style={{ fontSize: 12 }}>
          粘贴角色描述或故事摘录，系统将提取情感几何——人物关系、张力与权力格局。
        </p>
      </div>

      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={e => onTextChange(e.target.value)}
          placeholder={`Paste story text, character descriptions, or relationship notes...\n\nExample:\n樊长玉是一个屠户之女，家境贫寒，但性格坚韧刚强。她的妹妹樊长宁是她最深的羁绊。\n\n谢征，身份神秘，背负血海深仇，以契约婚姻与樊长玉相遇…`}
          className="w-full h-full resize-none rounded-xl p-4 text-ink-100 placeholder-ink-400 outline-none transition-all"
          style={{
            background: '#0A0B10',
            border: '1px solid #1F2333',
            fontSize: 13,
            lineHeight: 1.65,
            fontFamily: 'Inter, sans-serif',
            minHeight: 200,
          }}
          onFocus={e => { e.target.style.borderColor = '#363C57' }}
          onBlur={e  => { e.target.style.borderColor = '#1F2333' }}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onAnalyze}
          disabled={!text?.trim() || isAnalyzing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #E8B86D22, #C4905018)',
            border: '1px solid rgba(232,184,109,0.35)',
            color: '#E8B86D',
            fontSize: 13,
            letterSpacing: '0.04em',
          }}
        >
          <Sparkles size={14} />
          {isAnalyzing ? '分析中…' : '分析张力'}
        </button>

        <button
          onClick={onLoadSample}
          disabled={isAnalyzing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all hover:border-ink-400 disabled:opacity-40"
          style={{
            background: '#11131C',
            border: '1px solid #282D42',
            color: '#9AA0BA',
            fontSize: 13,
          }}
        >
          <BookOpen size={14} />
          加载逐玉示例
        </button>

        {text && (
          <button
            onClick={() => onTextChange('')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl transition-all hover:text-crimson-bright"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: '#6B7290',
              fontSize: 12,
            }}
          >
            <Trash2 size={12} />
            清除
          </button>
        )}
      </div>

      {/* Sample text hint */}
      {!text && (
        <div
          className="rounded-xl p-3.5 cursor-pointer group transition-all"
          style={{
            background: '#0D0F16',
            border: '1px solid #1F2333',
            fontSize: 11.5,
          }}
          onClick={() => onTextChange(SAMPLE_INPUT_TEXT)}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={11} className="text-ink-500" />
            <span className="text-ink-400 uppercase" style={{ fontSize: 9.5, letterSpacing: '0.14em' }}>
              示例片段（点击加载）
            </span>
          </div>
          <p className="text-ink-300 leading-relaxed group-hover:text-ink-200 transition-colors"
             style={{ lineHeight: 1.6 }}>
            {SAMPLE_INPUT_TEXT.slice(0, 120)}…
          </p>
        </div>
      )}

      {/* Parser note */}
      <div className="text-ink-400 leading-relaxed" style={{ fontSize: 10.5 }}>
        V1 使用模拟解析器，通过角色名识别逐玉人物并推断关系类型。将 <code className="text-ink-500">utils/parser.js</code> 替换为 LLM API 调用即可实现完整语义分析。
      </div>
    </div>
  )
}
