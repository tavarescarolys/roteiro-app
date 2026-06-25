'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const EMOTION_STYLES: Record<string, { bg: string; darkBg: string; color: string; darkColor: string; label: string }> = {
  URGÊNCIA: { bg: '#FCEBEB', darkBg: '#3b1010', color: '#501313', darkColor: '#ffb3b3', label: 'URGÊNCIA' },
  NEUTRO:   { bg: '#EAF3DE', darkBg: '#1a2e0d', color: '#173404', darkColor: '#a8d48a', label: 'NEUTRO' },
  CALMO:    { bg: '#E6F1FB', darkBg: '#0d1f35', color: '#042C53', darkColor: '#90bde8', label: 'CALMO' },
  ALEGRIA:  { bg: '#FAEEDA', darkBg: '#321d05', color: '#412402', darkColor: '#f5c98a', label: 'ALEGRIA' },
}

type Block = { emotion: string; text: string; isDirection: boolean }

function isDirection(t: string): boolean {
  return (
    /^\(ORIENTAÇÃO\)/i.test(t) ||
    (t.startsWith('(') && t.endsWith(')')) ||
    t.startsWith('#') ||
    /^\*\*.*\*\*$/.test(t) ||
    /^[-–—]{2,}$/.test(t) ||
    /^\*\*[^*]+:\*\*/.test(t)
  )
}

function parseScript(content: string): Block[] {
  const lines = content.split('\n').filter(l => l.trim())
  const blocks: Block[] = []
  for (const line of lines) {
    const t = line.trim()
    if (isDirection(t)) {
      const text = t
        .replace(/^\(ORIENTAÇÃO\)\s*/i, '')
        .replace(/^#+\s*/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^[-–—]+$/, '---')
      blocks.push({ emotion: '', text, isDirection: true })
      continue
    }
    const match = t.match(/^\[([A-ZÁÃÇÊÉÍÓÚ]+)\]\s*(.+)$/)
    if (match) {
      blocks.push({ emotion: match[1], text: match[2], isDirection: false })
    } else if (t) {
      blocks.push({ emotion: 'NEUTRO', text: t, isDirection: false })
    }
  }
  return blocks
}

export default function GeneratorPage() {
  const [dark, setDark] = useState(true)

  const [assunto, setAssunto] = useState('')
  const [angulo, setAngulo] = useState('')
  const [publico, setPublico] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [produto, setProduto] = useState('')
  const [sentimento, setSentimento] = useState('')

  const [platform, setPlatform] = useState('')
  const [duration, setDuration] = useState('')
  const [objective, setObjective] = useState('')

  const [blocks, setBlocks] = useState<Block[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('darkMode') === 'true') setDark(true)
  }, [])

  function toggleDark() {
    setDark(d => { localStorage.setItem('darkMode', String(!d)); return !d })
  }

  function startEdit(i: number) {
    setEditingIdx(i)
    setEditText(blocks[i].text)
  }

  function saveEdit(i: number) {
    setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, text: editText } : b))
    setEditingIdx(null)
  }

  function changeEmotion(i: number, emotion: string) {
    setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, emotion, isDirection: false } : b))
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setBlocks([])
    setEditingIdx(null)

    const theme = `Assunto: ${assunto}\nComo contar: ${angulo}\nPúblico-alvo: ${publico}\nMensagem principal: ${mensagem}${produto ? `\nProduto/serviço: ${produto}` : ''}`

    const res = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, theme, duration, objective, sentimento }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao gerar roteiro.')
      setLoading(false)
      return
    }

    setBlocks(parseScript(data.content))
    setLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const bg = dark ? '#0f0f0f' : '#f8f9fa'
  const card = dark ? '#1a1a1a' : '#ffffff'
  const text = dark ? '#e5e5e5' : '#1a1a1a'
  const muted = dark ? '#888' : '#6b7280'
  const border = dark ? '#2a2a2a' : '#e5e7eb'
  const inputBg = dark ? '#111' : '#fff'
  const inputText = dark ? '#e5e5e5' : '#1a1a1a'
  const inputBorder = dark ? '#333' : '#d1d5db'

  function exportPDF() { window.print() }

  function copyScript() {
    const text = blocks.map(b => b.isDirection ? `[${b.text}]` : b.text).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, transition: 'background 0.2s' }}>
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #script-print, #script-print * { visibility: visible !important; }
        #script-print { position: fixed; top: 0; left: 0; width: 100%; padding: 32px; background: white; }
        .no-print { display: none !important; }
        .direction-block { color: #666; font-style: italic; border-top: 1px dashed #ccc; padding: 4px 0; }
        .speech-block { border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; page-break-inside: avoid; }
        .emotion-label { display: block !important; font-size: 10px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
        .speech-text { font-size: 13px; line-height: 1.6; }
      }
    `}</style>
      <nav style={{ background: card, borderBottom: `1px solid ${border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>Gerador de Roteiros</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
          <Link href="/history" style={{ color: muted, textDecoration: 'none' }}>Histórico</Link>
          <Link href="/onboarding" style={{ color: muted, textDecoration: 'none' }}>Atualizar voz</Link>
          <button onClick={toggleDark} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: text, fontSize: 13 }}>
            {dark ? '☀️ Claro' : '🌙 Escuro'}
          </button>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 14 }}>Sair</button>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <form onSubmit={handleGenerate}>

          {/* Briefing */}
          <div style={{ background: card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${border}` }}>
            <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Briefing do vídeo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Sobre o que é esse vídeo?</label>
                <textarea required value={assunto} onChange={e => setAssunto(e.target.value)} rows={3}
                  placeholder="Descreva com detalhes. Ex: Quero falar sobre como freelancers podem cobrar mais caro sem perder clientes usando posicionamento."
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, background: inputBg, color: inputText, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Como você vai contar isso?</label>
                <select required value={angulo} onChange={e => setAngulo(e.target.value)}
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, background: inputBg, color: inputText, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Selecione</option>
                  <option value="Erro que a maioria comete">❌ Erro que a maioria comete</option>
                  <option value="Dica rápida e prática">💡 Dica rápida e prática</option>
                  <option value="Analogia ou comparação com algo do dia a dia">🔀 Analogia ou comparação</option>
                  <option value="Comparação antes e depois">🔄 Comparação antes e depois</option>
                  <option value="Resposta a uma dúvida comum">❓ Resposta a uma dúvida comum</option>
                  <option value="Opinião polêmica ou contraintuitiva">🔥 Opinião polêmica ou contraintuitiva</option>
                  <option value="Passo a passo para fazer algo">📋 Passo a passo para fazer algo</option>
                  <option value="Revelação ou curiosidade surpreendente">😲 Revelação ou curiosidade surpreendente</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Para quem é esse vídeo?</label>
                <input type="text" required value={publico} onChange={e => setPublico(e.target.value)}
                  placeholder="Ex: Mulheres 25–35 anos, empreendedoras iniciantes"
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, background: inputBg, color: inputText, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Qual mensagem principal você quer deixar?</label>
                <input type="text" required value={mensagem} onChange={e => setMensagem(e.target.value)}
                  placeholder="Ex: Que é possível ganhar mais trabalhando menos se você se posicionar certo."
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, background: inputBg, color: inputText, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Produto ou serviço envolvido? <span style={{ color: muted, fontWeight: 400 }}>(opcional)</span></label>
                <input type="text" value={produto} onChange={e => setProduto(e.target.value)}
                  placeholder="Ex: Mentoria, curso online, serviço de design..."
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, background: inputBg, color: inputText, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Config */}
          <div style={{ background: card, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${border}` }}>
            <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Configurações</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Plataforma</label>
                <select required value={platform} onChange={e => setPlatform(e.target.value)}
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, background: inputBg, color: inputText, outline: 'none' }}>
                  <option value="">Selecione</option>
                  <option>Reels</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Duração</label>
                <select required value={duration} onChange={e => setDuration(e.target.value)}
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, background: inputBg, color: inputText, outline: 'none' }}>
                  <option value="">Selecione</option>
                  <option>30s</option>
                  <option>60s</option>
                  <option>3min</option>
                  <option>5min+</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Objetivo</label>
                <select required value={objective} onChange={e => setObjective(e.target.value)}
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, background: inputBg, color: inputText, outline: 'none' }}>
                  <option value="">Selecione</option>
                  <option>Educar</option>
                  <option>Vender</option>
                  <option>Inspirar</option>
                  <option>Entreter</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 4 }}>Sentimento do vídeo</label>
                <select required value={sentimento} onChange={e => setSentimento(e.target.value)}
                  style={{ width: '100%', border: `1px solid ${inputBorder}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, background: inputBg, color: inputText, outline: 'none' }}>
                  <option value="">Selecione</option>
                  <option value="Motivacional — energia alta, empolgante">🔥 Motivacional</option>
                  <option value="Reflexivo — calmo, faz pensar">🧘 Reflexivo</option>
                  <option value="Divertido — leve, com humor">😄 Divertido</option>
                  <option value="Urgente — senso de pressa, alerta">⚡ Urgente</option>
                  <option value="Inspirador — emocional, tocante">✨ Inspirador</option>
                  <option value="Direto — objetivo, sem rodeios">🎯 Direto ao ponto</option>
                </select>
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ width: '100%', background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Gerando roteiro...' : 'Gerar roteiro →'}
          </button>
        </form>

        {/* Script output */}
        {blocks.length > 0 && (
          <div id="script-print" style={{ background: card, borderRadius: 16, padding: 24, marginTop: 20, border: `1px solid ${border}` }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 600, fontSize: 16 }}>Roteiro</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Object.entries(EMOTION_STYLES).map(([k, v]) => (
                    <span key={k} style={{ background: dark ? v.darkBg : v.bg, color: dark ? v.darkColor : v.color, fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {v.label}
                    </span>
                  ))}
                </div>
                <button onClick={copyScript}
                  style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: text }}>
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button onClick={exportPDF}
                  style={{ background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  ⬇ Exportar PDF
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {blocks.map((block, i) => {
                const s = EMOTION_STYLES[block.emotion] || EMOTION_STYLES.NEUTRO
                const bgColor = block.isDirection ? 'transparent' : (dark ? s.darkBg : s.bg)
                const textColor = block.isDirection ? muted : (dark ? s.darkColor : s.color)
                const isEditing = editingIdx === i

                return (
                  <div key={i} className={block.isDirection ? 'direction-block' : 'speech-block'}
                    style={{ background: bgColor, borderRadius: block.isDirection ? 0 : 12, padding: block.isDirection ? '4px 0' : '12px 16px', borderTop: block.isDirection ? `1px dashed ${border}` : 'none' }}>
                    {!block.isDirection && (
                      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <select
                          value={block.emotion}
                          onChange={e => changeEmotion(i, e.target.value)}
                          style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: 'transparent', border: 'none', color: textColor, cursor: 'pointer', outline: 'none', padding: 0 }}>
                          {Object.keys(EMOTION_STYLES).map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                        <button onClick={() => isEditing ? saveEdit(i) : startEdit(i)}
                          style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: textColor, opacity: 0.7, padding: '2px 6px' }}>
                          {isEditing ? '✓ Salvar' : '✏️ Editar'}
                        </button>
                      </div>
                    )}
                    {!block.isDirection && (
                      <div className="emotion-label" style={{ display: 'none', color: textColor, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                        [{block.emotion}]
                      </div>
                    )}

                    {isEditing ? (
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        autoFocus
                        rows={3}
                        style={{ width: '100%', background: 'transparent', border: `1px solid ${textColor}`, borderRadius: 8, padding: '6px 8px', fontSize: 14, color: textColor, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <p style={{ color: textColor, fontSize: block.isDirection ? 12 : 14, lineHeight: 1.6, margin: 0, fontStyle: block.isDirection ? 'italic' : 'normal' }}>
                        {block.text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="no-print" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={copyScript}
                style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: text }}>
                {copied ? '✓ Copiado' : 'Copiar roteiro'}
              </button>
              <button onClick={exportPDF}
                style={{ background: dark ? '#fff' : '#000', color: dark ? '#000' : '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                ⬇ Exportar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
