'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Step = 'context' | 'intro' | 'recording' | 'review' | 'saving'

const LIMIT_SECONDS = 60

const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', input: '#0f0e11', inputBorder: '#3a3740',
  red: '#B7022C',
}

function ProgressBar({ step }: { step: Step }) {
  const stepNum = step === 'context' ? 1 : step === 'intro' || step === 'recording' ? 2 : 3
  const labels = ['Contexto', 'Gravação', 'Revisão']
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: D.muted, marginBottom: 8 }}>
        <span>Etapa {stepNum} de 3</span>
        <span>{labels[stepNum - 1]}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: '#2a2a2a', borderRadius: 4 }}>
        <div style={{ height: 6, background: '#fff', borderRadius: 4, width: `${(stepNum / 3) * 100}%`, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: D.text, outline: 'none', boxSizing: 'border-box' }} />
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('context')
  const [nome, setNome] = useState('')
  const [profissao, setProfissao] = useState('')
  const [audiencia, setAudiencia] = useState('')
  const [transcript, setTranscript] = useState('')
  const [profileText, setProfileText] = useState('')
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(LIMIT_SECONDS)
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fullTranscriptRef = useRef('')

  useEffect(() => () => {
    recognitionRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  function startRecording() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Seu navegador não suporta reconhecimento de voz. Use o Chrome.'); return }

    fullTranscriptRef.current = ''
    setTranscript('')
    setSecondsLeft(LIMIT_SECONDS)

    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) fullTranscriptRef.current += event.results[i][0].transcript + ' '
        else interim = event.results[i][0].transcript
      }
      setTranscript(fullTranscriptRef.current + interim)
    }

    recognition.onerror = () => stopRecording()
    recognition.onend = () => { setTranscript(fullTranscriptRef.current); setStep('review') }

    recognitionRef.current = recognition
    recognition.start()
    setStep('recording')

    let secs = LIMIT_SECONDS
    timerRef.current = setInterval(() => {
      secs -= 1
      setSecondsLeft(secs)
      if (secs <= 0) stopRecording()
    }, 1000)
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    recognitionRef.current?.stop()
  }

  async function analyzeProfile() {
    setStep('saving')
    setError('')
    const res = await fetch('/api/voice-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcription: transcript }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Erro ao analisar perfil.'); setStep('review'); return }
    setProfileText(data.profile)
    setStep('review')
  }

  async function saveProfile() {
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const fullProfile = `Nome: ${nome}\nProfissão: ${profissao}\nAudiência: ${audiencia}\n\n${profileText}`
    const { error } = await supabase.from('voice_profiles').upsert(
      { user_id: user.id, transcription: transcript, profile_text: fullProfile },
      { onConflict: 'user_id' }
    )
    if (error) { setError('Erro ao salvar perfil.'); return }
    router.push('/generator')
  }

  const timerColor = secondsLeft <= 10 ? '#ef4444' : secondsLeft <= 20 ? '#f59e0b' : '#22c55e'

  const btnPrimary = { width: '100%', background: D.red, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 } as const
  const btnSecondary = { flex: 1, background: 'none', border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: D.text } as const
  const label = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: D.text } as const

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: D.bg, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480, background: D.card, borderRadius: 20, padding: 32, border: `1px solid ${D.border}`, color: D.text }}>
        <ProgressBar step={step} />

        {/* Etapa 1 — Contexto */}
        {step === 'context' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>Etapa 1 — Contexto</h1>
            <p style={{ color: D.muted, fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
              Essas informações personalizam todos os seus roteiros automaticamente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={label}>Qual seu nome ou como gosta de ser chamado(a)?</label>
                <Input value={nome} onChange={setNome} placeholder="Ex: Carol, Tiago, Pri..." />
              </div>
              <div>
                <label style={label}>Qual é a sua área ou profissão?</label>
                <Input value={profissao} onChange={setProfissao} placeholder="Ex: nutricionista, designer, coach de carreira..." />
              </div>
              <div>
                <label style={label}>Quem é sua audiência principal?</label>
                <Input value={audiencia} onChange={setAudiencia} placeholder="Ex: mulheres 30–45 anos, empreendedores iniciantes..." />
              </div>
            </div>
            <button onClick={() => setStep('intro')} disabled={!nome.trim() || !profissao.trim() || !audiencia.trim()}
              style={{ ...btnPrimary, marginTop: 24, opacity: (!nome.trim() || !profissao.trim() || !audiencia.trim()) ? 0.4 : 1 }}>
              Continuar →
            </button>
          </div>
        )}

        {/* Etapa 2 — Intro */}
        {step === 'intro' && (
          <div>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🎙️</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>Etapa 2 — Gravação</h1>
            <p style={{ color: D.muted, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
              Você tem <strong style={{ color: D.text }}>1 minuto</strong> para falar. O app vai capturar seu jeito de se expressar.
            </p>
            <div style={{ background: '#111', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 13, lineHeight: 1.7 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>💡 O que falar:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li style={{ color: '#aaa' }}>→ O assunto que você mais domina no seu nicho</li>
                <li style={{ color: '#aaa' }}>→ Como você ajuda sua audiência — como se contasse pra um amigo</li>
                <li style={{ color: '#aaa' }}>→ Uma situação real que seus seguidores costumam passar</li>
                <li style={{ color: '#aaa' }}>→ Uma dica rápida do jeito que você falaria num vídeo</li>
              </ul>
              <p style={{ color: '#555', fontSize: 12, marginTop: 10 }}>Gírias, pausas e erros são bem-vindos.</p>
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button onClick={startRecording} style={btnPrimary}>Começar gravação</button>
          </div>
        )}

        {/* Etapa 2 — Gravando */}
        {step === 'recording' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#ef4444' }}>Gravando...</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#2a2a2a', borderRadius: 4, marginBottom: 16 }}>
              <div style={{ height: 6, borderRadius: 4, background: timerColor, width: `${(secondsLeft / LIMIT_SECONDS) * 100}%`, transition: 'width 1s linear' }} />
            </div>
            <div style={{ background: '#111', borderRadius: 12, padding: 16, minHeight: 120, fontSize: 13, color: '#aaa', lineHeight: 1.6, marginBottom: 20 }}>
              {transcript || <span style={{ color: '#444' }}>Sua fala aparecerá aqui...</span>}
            </div>
            <button onClick={stopRecording} style={{ ...btnPrimary, background: '#ef4444' }}>Parar gravação</button>
          </div>
        )}

        {/* Etapa 3 — Revisão */}
        {step === 'review' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Etapa 3 — Revisão</h2>
            <p style={{ color: D.muted, fontSize: 13, marginBottom: 14 }}>Corrija o texto se necessário antes de analisar.</p>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
              style={{ width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: D.text, minHeight: 120, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />

            {profileText && (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Perfil de comunicação extraído:</p>
                <textarea value={profileText} onChange={e => setProfileText(e.target.value)}
                  style={{ width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: D.text, minHeight: 100, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
              </>
            )}

            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setStep('intro'); setTranscript(''); setProfileText('') }} style={btnSecondary}>Regravar</button>
              {!profileText ? (
                <button onClick={analyzeProfile} disabled={!transcript.trim()}
                  style={{ ...btnPrimary, flex: 1, width: 'auto', opacity: !transcript.trim() ? 0.4 : 1 }}>
                  Analisar perfil
                </button>
              ) : (
                <button onClick={saveProfile} style={{ ...btnPrimary, flex: 1, width: 'auto' }}>
                  Salvar e continuar →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Salvando */}
        {step === 'saving' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚙️</div>
            <p style={{ color: D.muted }}>Analisando seu perfil de comunicação...</p>
          </div>
        )}
      </div>
    </div>
  )
}
