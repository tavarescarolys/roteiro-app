'use client'
import { LOGO_SRC } from '@/lib/logo'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', input: '#0f0e11', inputBorder: '#3a3740',
  red: '#B7022C',
}

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleUpdate() {
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => { window.location.href = '/login' }, 3000)
  }

  const inp = { width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: D.text, outline: 'none', boxSizing: 'border-box' } as const

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: D.bg, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO_SRC} alt="Do Bolso pra Tela" style={{ height: 60, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          <p style={{ color: D.muted, fontSize: 12, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Gerador de Roteiros</p>
        </div>

        <div style={{ background: D.card, borderRadius: 16, padding: 32, border: `1px solid ${D.border}` }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ color: D.text, fontWeight: 600, marginBottom: 8 }}>Senha atualizada!</p>
              <p style={{ color: D.muted, fontSize: 13 }}>Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: D.text, marginBottom: 4 }}>Nova senha</h1>
              <p style={{ color: D.muted, fontSize: 13, marginBottom: 24 }}>Escolha uma senha segura para sua conta.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nova senha</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirmar senha</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a senha" style={inp} />
                </div>
                {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
                <button type="button" onClick={handleUpdate} disabled={loading}
                  style={{ width: '100%', background: D.red, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1, opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
