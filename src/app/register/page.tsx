'use client'
import { LOGO_SRC } from '@/lib/logo'

import { useState } from 'react'
import Link from 'next/link'

const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', input: '#0f0e11', inputBorder: '#3a3740',
  red: '#B7022C', redHover: '#E0143F',
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!email || !password) return
    setError('')
    setLoading(true)

    let res: Response, data: any
    try {
      res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      data = await res.json()
    } catch (err: any) {
      setError('Erro de conexão. Tente novamente em alguns instantes.')
      setLoading(false)
      return
    }

    if (!res.ok) {
      const msg = data.error || ''
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already been registered')) {
        setError('Esse email já tem uma conta. Clique em "Entrar" para fazer login.')
      } else {
        setError(msg || 'Erro ao criar conta.')
      }
      setLoading(false)
      return
    }

    window.location.href = '/onboarding'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: D.bg, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={LOGO_SRC} alt="Do Bolso pra Tela" style={{ height: 60, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          <p style={{ color: D.muted, fontSize: 12, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Gerador de Roteiros</p>
        </div>

        <div style={{ background: D.card, borderRadius: 16, padding: 32, border: `1px solid ${D.border}` }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: D.text, marginBottom: 4 }}>Criar conta</h1>
          <p style={{ color: D.muted, fontSize: 13, marginBottom: 24 }}>Preencha seus dados para começar</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                style={{ width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: D.text, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                style={{ width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: D.text, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {error && (
              <p style={{ color: '#f87171', fontSize: 13, background: '#3b1010', borderRadius: 8, padding: '10px 12px', margin: 0 }}>{error}</p>
            )}

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading || !email || password.length < 6}
              style={{ width: '100%', background: D.red, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: (loading || !email || password.length < 6) ? 'not-allowed' : 'pointer', opacity: (loading || !email || password.length < 6) ? 0.6 : 1, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 20, color: D.muted }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: D.text, fontWeight: 600, textDecoration: 'underline' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
