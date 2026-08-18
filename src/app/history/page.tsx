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

const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', red: '#B7022C',
}

const EMOTION_STYLES: Record<string, { bg: string; color: string }> = {
  URGÊNCIA: { bg: '#3b1010', color: '#ffb3b3' },
  NEUTRO:   { bg: '#1a2e0d', color: '#a8d48a' },
  CALMO:    { bg: '#0d1f35', color: '#90bde8' },
  ALEGRIA:  { bg: '#321d05', color: '#f5c98a' },
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
    <div style={{ minHeight: '100vh', background: D.bg, color: D.text, fontFamily: 'Montserrat, sans-serif' }}>
      <nav style={{ background: D.card, borderBottom: `1px solid ${D.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '4px 8px' }}>
            <span style={{ fontWeight: 900, fontSize: 10, color: '#17151A', letterSpacing: 0.5, textTransform: 'uppercase' }}>DO BOLSO PRA TELA</span>
          </div>
          <span style={{ color: D.muted, fontSize: 12 }}>/ Histórico</span>
        </div>
        <Link href="/generator" style={{ color: D.muted, fontSize: 13, textDecoration: 'none' }}>← Voltar</Link>
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 16px' }}>
        <h2 style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, color: D.muted }}>Seus roteiros</h2>

        {loading && <p style={{ color: D.muted, fontSize: 13 }}>Carregando...</p>}

        {!loading && scripts.length === 0 && (
          <div style={{ background: D.card, borderRadius: 14, padding: 40, textAlign: 'center', border: `1px solid ${D.border}` }}>
            <p style={{ fontSize: 13, marginBottom: 16, color: D.muted }}>Você ainda não gerou nenhum roteiro.</p>
            <Link href="/generator" style={{ background: D.red, color: '#fff', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Gerar primeiro roteiro
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {scripts.map(s => {
            const isOpen = expanded === s.id
            const blocks = isOpen ? parseBlocks(s.content) : []
            return (
              <div key={s.id} style={{ background: D.card, borderRadius: 12, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
                <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.theme}</p>
                    <p style={{ fontSize: 11, color: D.muted, marginTop: 3 }}>{formatDate(s.created_at)}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {[s.platform, s.duration, s.objective].filter(Boolean).map((tag, i) => (
                        <span key={i} style={{ background: '#2a2733', color: D.muted, fontSize: 11, padding: '2px 8px', borderRadius: 5 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleCopy(s)}
                      style={{ fontSize: 12, borderRadius: 7, padding: '6px 12px', fontWeight: 600, border: `1px solid ${D.border}`, background: 'none', color: D.muted, cursor: 'pointer' }}>
                      {copied === s.id ? '✓ Copiado' : 'Copiar'}
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : s.id)}
                      style={{ fontSize: 12, borderRadius: 7, padding: '6px 12px', fontWeight: 700, background: D.red, color: '#fff', border: 'none', cursor: 'pointer' }}>
                      {isOpen ? 'Fechar' : 'Ver roteiro'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '4px 16px 16px', borderTop: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {blocks.map((block, i) => {
                      if (block.isDirection) return (
                        <p key={i} style={{ fontSize: 12, color: D.muted, fontStyle: 'italic', borderTop: `1px dashed ${D.border}`, paddingTop: 6, margin: 0 }}>{block.text}</p>
                      )
                      const st = EMOTION_STYLES[block.emotion] || EMOTION_STYLES.NEUTRO
                      return (
                        <div key={i} style={{ background: st.bg, borderRadius: 10, padding: '10px 14px' }}>
                          <span style={{ color: st.color, fontSize: 10, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 4 }}>[{block.emotion}]</span>
                          <p style={{ color: st.color, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{block.text}</p>
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
