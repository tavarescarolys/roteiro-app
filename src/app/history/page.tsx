'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Script = {
  id: string
  platform: string
  theme: string
  duration: string
  objective: string
  content: string
  created_at: string
}

const EMOTION_STYLES: Record<string, { bg: string; color: string }> = {
  URGÊNCIA: { bg: '#FCEBEB', color: '#501313' },
  NEUTRO:   { bg: '#EAF3DE', color: '#173404' },
  CALMO:    { bg: '#E6F1FB', color: '#042C53' },
  ALEGRIA:  { bg: '#FAEEDA', color: '#412402' },
}

function parseBlocks(content: string) {
  return content.split('\n').filter(l => l.trim()).map(line => {
    const match = line.match(/^\[([A-ZÁÃÇÊÉÍÓÚ]+)\]\s*(.+)$/)
    if (match) return { emotion: match[1], text: match[2], isDirection: false }
    if (/^\(ORIENTAÇÃO\)/i.test(line)) return { emotion: '', text: line.replace(/^\(ORIENTAÇÃO\)\s*/i, ''), isDirection: true }
    if (line.startsWith('(') && line.endsWith(')')) return { emotion: '', text: line.slice(1, -1), isDirection: true }
    return { emotion: 'NEUTRO', text: line.trim(), isDirection: false }
  })
}

function copyClean(content: string) {
  const lines = content.split('\n').filter(l => l.trim()).map(line => {
    const match = line.match(/^\[([A-ZÁÃÇÊÉÍÓÚ]+)\]\s*(.+)$/)
    if (match) return match[2]
    if (/^\(ORIENTAÇÃO\)/i.test(line)) return `[${line.replace(/^\(ORIENTAÇÃO\)\s*/i, '')}]`
    return line.trim()
  }).join('\n')
  navigator.clipboard.writeText(lines)
}

export default function HistoryPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('scripts')
        .select('id, platform, theme, duration, objective, content, created_at')
        .order('created_at', { ascending: false })
      setScripts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function handleCopy(s: Script) {
    copyClean(s.content)
    setCopied(s.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f0f0f', color: '#e5e5e5' }}>
      <nav style={{ background: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }} className="px-6 py-3 flex items-center justify-between">
        <Link href="/generator" className="font-bold text-lg">Gerador de Roteiros</Link>
        <span className="text-sm text-gray-500">Histórico</span>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="font-semibold text-xl mb-4">Seus roteiros</h2>

        {loading && <p className="text-gray-400 text-sm">Carregando...</p>}

        {!loading && scripts.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <p className="text-sm mb-4" style={{ color: '#888' }}>Você ainda não gerou nenhum roteiro.</p>
            <Link href="/generator" className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: '#fff', color: '#000' }}>
              Gerar primeiro roteiro
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {scripts.map(s => {
            const isOpen = expanded === s.id
            const blocks = isOpen ? parseBlocks(s.content) : []
            return (
              <div key={s.id} className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                {/* Header */}
                <div className="p-4 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#e5e5e5' }}>{s.theme}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#666' }}>{formatDate(s.created_at)}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="rounded px-2 py-0.5 text-xs" style={{ background: '#2a2a2a', color: '#aaa' }}>{s.platform}</span>
                      <span className="rounded px-2 py-0.5 text-xs" style={{ background: '#2a2a2a', color: '#aaa' }}>{s.duration}</span>
                      <span className="rounded px-2 py-0.5 text-xs" style={{ background: '#2a2a2a', color: '#aaa' }}>{s.objective}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleCopy(s)}
                      className="text-xs rounded-lg px-3 py-1.5 font-medium" style={{ border: '1px solid #333', background: 'none', color: '#aaa', cursor: 'pointer' }}>
                      {copied === s.id ? '✓ Copiado' : 'Copiar'}
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="text-xs rounded-lg px-3 py-1.5 font-medium" style={{ background: '#fff', color: '#000', border: 'none', cursor: 'pointer' }}>
                      {isOpen ? 'Fechar' : 'Ver roteiro'}
                    </button>
                  </div>
                </div>

                {/* Content */}
                {isOpen && (
                  <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid #2a2a2a' }}>
                    {blocks.map((block, i) => {
                      if (block.isDirection) return (
                        <p key={i} className="text-xs text-gray-400 italic py-1 border-t border-dashed border-gray-200">{block.text}</p>
                      )
                      const st = EMOTION_STYLES[block.emotion] || EMOTION_STYLES.NEUTRO
                      return (
                        <div key={i} style={{ background: st.bg }} className="rounded-xl p-3">
                          <span style={{ color: st.color }} className="text-xs font-bold tracking-wider block mb-1">[{block.emotion}]</span>
                          <p style={{ color: st.color }} className="text-sm leading-relaxed">{block.text}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
