'use client'
import { LOGO_SRC } from '@/lib/logo'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', input: '#0f0e11', inputBorder: '#3a3740',
  red: '#B7022C', redHover: '#E0143F',
}

const EMOTION_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  URGÊNCIA: { bg: '#3b1010', color: '#ffb3b3', label: 'URGÊNCIA' },
  NEUTRO:   { bg: '#1a2e0d', color: '#a8d48a', label: 'NEUTRO' },
  CALMO:    { bg: '#0d1f35', color: '#90bde8', label: 'CALMO' },
  ALEGRIA:  { bg: '#321d05', color: '#f5c98a', label: 'ALEGRIA' },
}

const LOADING_STEPS = [
  'Lendo seu perfil de voz...',
  'Construindo o gancho...',
  'Desenvolvendo o conteúdo...',
  'Ajustando para seu jeito de falar...',
  'Finalizando o roteiro...',
]

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

function blocksToText(blocks: Block[]): string {
  return blocks.map(b => b.isDirection ? `(ORIENTAÇÃO) ${b.text}` : `[${b.emotion}] ${b.text}`).join('\n')
}

export default function GeneratorPage() {
  const [assunto, setAssunto] = useState('')
  const [angulo, setAngulo] = useState('')
  const [publico, setPublico] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [produto, setProduto] = useState('')
  const [sentimento, setSentimento] = useState('')
  const [platform, setPlatform] = useState('')
  const [duration, setDuration] = useState('')
  const [objective, setObjective] = useState('')
  const [ctas, setCtas] = useState<string[]>([])
  const [scriptCount, setScriptCount] = useState<number | null>(null)
  const [userName, setUserName] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [scriptTitle, setScriptTitle] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [regenIdx, setRegenIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [{ count }, { data: profile }] = await Promise.all([
        supabase.from('scripts').select('id', { count: 'exact', head: true }),
        supabase.from('voice_profiles').select('profile_text').single(),
      ])
      setScriptCount(count ?? 0)
      if (profile?.profile_text) {
        const match = profile.profile_text.match(/^Nome:\s*(.+)/m)
        if (match) setUserName(match[1].trim())
      }
    }
    fetchData()
  }, [blocks])

  function startLoadingAnim() {
    setLoadingStep(0)
    let step = 0
    loadingTimer.current = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1)
      setLoadingStep(step)
    }, 1400)
  }

  function stopLoadingAnim() {
    if (loadingTimer.current) { clearInterval(loadingTimer.current); loadingTimer.current = null }
  }

  function startEdit(i: number) { setEditingIdx(i); setEditText(blocks[i].text) }
  function saveEdit(i: number) {
    setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, text: editText } : b))
    setEditingIdx(null)
  }
  function changeEmotion(i: number, emotion: string) {
    setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, emotion, isDirection: false } : b))
  }

  async function regenBlock(i: number) {
    setRegenIdx(i)
    const block = blocks[i]
    const res = await fetch('/api/regen-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockText: block.text, emotion: block.emotion, fullScript: blocksToText(blocks) }),
    })
    const data = await res.json()
    if (res.ok && data.text) {
      setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, text: data.text } : b))
    }
    setRegenIdx(null)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setBlocks([])
    setEditingIdx(null)
    startLoadingAnim()

    const theme = `Assunto: ${assunto}\nComo contar: ${angulo}\nPúblico-alvo: ${publico}\nMensagem principal: ${mensagem}${produto ? `\nProduto/serviço: ${produto}` : ''}`

    const res = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, theme, duration, objective, sentimento, ctas }),
    })
    stopLoadingAnim()
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao gerar roteiro.'); setLoading(false); return }
    setBlocks(parseScript(data.content))
    setScriptTitle(assunto.split('\n')[0].slice(0, 80))
    setLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function exportPDF() { window.print() }

  function copyScript() {
    const txt = blocks.map(b => b.isDirection ? `[${b.text}]` : b.text).join('\n')
    navigator.clipboard.writeText(txt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inp = { width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: D.text, outline: 'none', boxSizing: 'border-box' } as const
  const lbl = { display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 } as const
  const req = <span style={{ color: D.red, marginLeft: 2 }}>*</span>

  return (
    <div style={{ minHeight: '100vh', background: D.bg, color: D.text, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap');
        @media print {
          @page { margin: 20mm 18mm; size: A4; }
          body * { visibility: hidden !important; }
          #script-print, #script-print * { visibility: visible !important; }
          #script-print {
            position: absolute; top: 0; left: 0;
            width: 100%; padding: 40px;
            background: white !important;
            border: none !important; border-radius: 0 !important;
            font-family: Montserrat, sans-serif;
          }
          .no-print { display: none !important; }
          .print-title { display: block !important; font-size: 18px; font-weight: 700; color: #111; margin-bottom: 4px; }
          .print-meta { display: block !important; font-size: 11px; color: #888; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
          .direction-block { color: #888 !important; font-style: italic; font-size: 11px; border-top: 1px dashed #ddd !important; padding: 6px 0; margin: 4px 0; }
          .speech-block { border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; page-break-inside: avoid; }
          .emotion-label { display: block !important; font-size: 10px; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px; }
          .speech-text { font-size: 13px; line-height: 1.7; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress-pulse { 0%,100% { opacity:.6 } 50% { opacity:1 } }
      `}</style>

      {/* Nav */}
      <nav className="no-print" style={{ background: D.card, borderBottom: `1px solid ${D.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={LOGO_SRC} alt="Do Bolso pra Tela" style={{ height: 32, objectFit: 'contain' }} />
          <span style={{ color: D.muted, fontSize: 12 }}>/ Roteiros</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13 }}>
          {scriptCount !== null && (
            <span style={{ color: D.muted, fontSize: 12, background: '#2a2733', padding: '3px 10px', borderRadius: 20 }}>
              {scriptCount} {scriptCount === 1 ? 'roteiro' : 'roteiros'}
            </span>
          )}
          <Link href="/history" style={{ color: D.muted, textDecoration: 'none' }}>Histórico</Link>
          <Link href="/onboarding" style={{ color: D.muted, textDecoration: 'none' }}>Atualizar voz</Link>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.muted, fontSize: 13 }}>Sair</button>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 16px' }}>

        {userName && (
          <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, marginBottom: 24 }}>
            Bora criar um roteiro
            <span style={{ color: D.red }}>, {userName}</span>
            {' '}🎬
          </h1>
        )}

        <form onSubmit={handleGenerate}>

          {/* Briefing */}
          <div style={{ background: D.card, borderRadius: 14, padding: 24, marginBottom: 14, border: `1px solid ${D.border}` }}>
            <h2 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, textTransform: 'uppercase', letterSpacing: 1, color: D.muted }}>Briefing do vídeo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Sobre o que é esse vídeo?{req}</label>
                <textarea required value={assunto} onChange={e => setAssunto(e.target.value)} rows={3}
                  placeholder="Ex: Quero falar sobre como freelancers podem cobrar mais caro sem perder clientes usando posicionamento."
                  style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div>
                <label style={lbl}>Como você vai contar isso?{req}</label>
                <select required value={angulo} onChange={e => setAngulo(e.target.value)} style={inp}>
                  <option value="">Selecione</option>
                  <option value="Erro que a maioria comete">❌ Erro que a maioria comete</option>
                  <option value="Dica rápida e prática">💡 Dica rápida e prática</option>
                  <option value="Analogia ou comparação com algo do dia a dia">🔀 Analogia ou comparação</option>
                  <option value="Comparação antes e depois">🔄 Comparação antes e depois</option>
                  <option value="Resposta a uma dúvida comum">❓ Resposta a uma dúvida comum</option>
                  <option value="Opinião polêmica ou contraintuitiva">🔥 Opinião polêmica ou contraintuitiva</option>
                  <option value="Passo a passo para fazer algo">📋 Passo a passo</option>
                  <option value="Revelação ou curiosidade surpreendente">😲 Revelação surpreendente</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Para quem é esse vídeo?{req}</label>
                <input type="text" required value={publico} onChange={e => setPublico(e.target.value)}
                  placeholder="Ex: Mulheres 25–35 anos, empreendedoras iniciantes" style={inp} />
              </div>
              <div>
                <label style={lbl}>Qual mensagem principal você quer deixar?{req}</label>
                <input type="text" required value={mensagem} onChange={e => setMensagem(e.target.value)}
                  placeholder="Ex: Que é possível ganhar mais trabalhando menos se você se posicionar certo." style={inp} />
              </div>
              <div>
                <label style={lbl}>Produto ou serviço envolvido? <span style={{ fontWeight: 400 }}>(opcional)</span></label>
                <input type="text" value={produto} onChange={e => setProduto(e.target.value)}
                  placeholder="Ex: Mentoria, curso online, serviço de design..." style={inp} />
              </div>
            </div>
          </div>

          {/* Config */}
          <div style={{ background: D.card, borderRadius: 14, padding: 24, marginBottom: 14, border: `1px solid ${D.border}` }}>
            <h2 style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, textTransform: 'uppercase', letterSpacing: 1, color: D.muted }}>Configurações</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Plataforma{req}</label>
                <select required value={platform} onChange={e => setPlatform(e.target.value)} style={inp}>
                  <option value="">Selecione</option>
                  <option>Reels</option><option>TikTok</option><option>YouTube</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Duração{req}</label>
                <select required value={duration} onChange={e => setDuration(e.target.value)} style={inp}>
                  <option value="">Selecione</option>
                  <option>30s</option><option>60s</option><option>3min</option><option>5min+</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Objetivo{req}</label>
                <select required value={objective} onChange={e => setObjective(e.target.value)} style={inp}>
                  <option value="">Selecione</option>
                  <option>Educar</option><option>Vender</option><option>Inspirar</option><option>Entreter</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Sentimento do vídeo{req}</label>
                <select required value={sentimento} onChange={e => setSentimento(e.target.value)} style={inp}>
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

          {/* CTA */}
          <div style={{ background: D.card, borderRadius: 14, padding: 24, marginBottom: 14, border: `1px solid ${D.border}` }}>
            <h2 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, color: D.muted }}>Call to action</h2>
            <p style={{ fontSize: 12, color: D.muted, marginBottom: 14 }}>Selecione o que você quer que o público faça ao final. Pode escolher mais de um.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'salvar', label: '🔖 Salvar o vídeo' },
                { id: 'compartilhar', label: '↗ Compartilhar' },
                { id: 'comentar', label: '💬 Comentar' },
                { id: 'marcar_amigo', label: '👥 Marcar um amigo' },
                { id: 'seguir', label: '➕ Seguir o perfil' },
                { id: 'link_bio', label: '🔗 Clicar no link da bio' },
                { id: 'responder', label: '✍️ Responder uma pergunta' },
                { id: 'dm', label: '📩 Mandar mensagem' },
              ].map(opt => {
                const selected = ctas.includes(opt.id)
                return (
                  <button key={opt.id} type="button"
                    onClick={() => setCtas(prev => selected ? prev.filter(c => c !== opt.id) : [...prev, opt.id])}
                    style={{ fontSize: 13, padding: '7px 14px', borderRadius: 8, border: `1px solid ${selected ? D.red : D.border}`, background: selected ? `${D.red}22` : 'none', color: selected ? D.text : D.muted, cursor: 'pointer', fontWeight: selected ? 700 : 400, transition: 'all 0.15s' }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ width: '100%', background: D.red, color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, textTransform: 'uppercase', letterSpacing: 1 }}>
            {loading ? 'Gerando...' : 'Gerar roteiro →'}
          </button>
        </form>

        {/* Loading progress */}
        {loading && (
          <div style={{ background: D.card, borderRadius: 14, padding: 32, marginTop: 20, border: `1px solid ${D.border}`, textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${D.border}`, borderTopColor: D.red, borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.9s linear infinite' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LOADING_STEPS.map((msg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i <= loadingStep ? 1 : 0.2, transition: 'opacity 0.4s' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < loadingStep ? D.red : i === loadingStep ? D.red : D.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0, animation: i === loadingStep ? 'progress-pulse 1s ease infinite' : 'none' }}>
                    {i < loadingStep ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: 13, color: i <= loadingStep ? D.text : D.muted, textAlign: 'left' }}>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Script output */}
        {blocks.length > 0 && (
          <div id="script-print" style={{ background: D.card, borderRadius: 14, padding: 24, marginTop: 20, border: `1px solid ${D.border}` }}>

            {/* Cabeçalho visível só no PDF */}
            <div style={{ position: 'absolute', visibility: 'hidden', height: 0, overflow: 'hidden' }} className="print-title">{scriptTitle || 'Roteiro'}</div>
            <div style={{ position: 'absolute', visibility: 'hidden', height: 0, overflow: 'hidden' }} className="print-meta">
              {[platform, duration, objective].filter(Boolean).join(' · ')} — Do Bolso pra Tela
            </div>

            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: D.muted }}>Roteiro</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Object.entries(EMOTION_STYLES).map(([k, v]) => (
                    <span key={k} style={{ background: v.bg, color: v.color, fontSize: 10, padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>{v.label}</span>
                  ))}
                </div>
                <button onClick={copyScript}
                  style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: D.text }}>
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button onClick={exportPDF}
                  style={{ background: D.red, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  ⬇ PDF
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {blocks.map((block, i) => {
                const s = EMOTION_STYLES[block.emotion] || EMOTION_STYLES.NEUTRO
                const isEditing = editingIdx === i
                const isRegening = regenIdx === i
                return (
                  <div key={i} className={block.isDirection ? 'direction-block' : 'speech-block'}
                    style={{ background: block.isDirection ? 'transparent' : s.bg, borderRadius: block.isDirection ? 0 : 10, padding: block.isDirection ? '4px 0' : '12px 16px', borderTop: block.isDirection ? `1px dashed ${D.border}` : 'none', opacity: isRegening ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    {!block.isDirection && (
                      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <select value={block.emotion} onChange={e => changeEmotion(i, e.target.value)}
                          style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, background: 'transparent', border: 'none', color: s.color, cursor: 'pointer', outline: 'none', padding: 0 }}>
                          {Object.keys(EMOTION_STYLES).map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => regenBlock(i)} disabled={isRegening || regenIdx !== null}
                            style={{ fontSize: 11, background: 'none', border: `1px solid ${s.color}40`, borderRadius: 5, cursor: 'pointer', color: s.color, opacity: 0.7, padding: '2px 8px' }}>
                            {isRegening ? '...' : '↺ Regerar'}
                          </button>
                          <button onClick={() => isEditing ? saveEdit(i) : startEdit(i)}
                            style={{ fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', color: s.color, opacity: 0.8, padding: '2px 6px' }}>
                            {isEditing ? '✓ Salvar' : '✏️ Editar'}
                          </button>
                        </div>
                      </div>
                    )}
                    {!block.isDirection && (
                      <div className="emotion-label" style={{ display: 'none', color: s.color, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
                        [{block.emotion}]
                      </div>
                    )}
                    {isEditing ? (
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} autoFocus rows={3}
                        style={{ width: '100%', background: 'transparent', border: `1px solid ${s.color}`, borderRadius: 8, padding: '6px 8px', fontSize: 14, color: s.color, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                    ) : (
                      <p style={{ color: block.isDirection ? D.muted : s.color, fontSize: block.isDirection ? 12 : 14, lineHeight: 1.6, margin: 0, fontStyle: block.isDirection ? 'italic' : 'normal' }}>
                        {block.text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="no-print" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={copyScript}
                style={{ background: 'none', border: `1px solid ${D.border}`, borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: D.text }}>
                {copied ? '✓ Copiado' : 'Copiar roteiro'}
              </button>
              <button onClick={exportPDF}
                style={{ background: D.red, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ⬇ Exportar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
