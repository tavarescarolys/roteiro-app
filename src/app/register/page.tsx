'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', input: '#0f0e11', inputBorder: '#3a3740',
  red: '#B7022C', redHover: '#E0143F',
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
        setError('Esse email já tem uma conta. Clique em "Entrar" para fazer login.')
      } else {
        setError(signUpError.message || 'Erro ao criar conta.')
      }
      setLoading(false)
      return
    }

    await supabase.auth.signInWithPassword({ email, password })
    router.push('/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: D.bg, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Do Bolso pra Tela" style={{ height: 60, objectFit: 'contain' }} />
          <p style={{ color: D.muted, fontSize: 12, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' }}>Gerador de Roteiros</p>
        </div>

        <div style={{ background: D.card, borderRadius: 16, padding: 32, border: `1px solid ${D.border}` }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: D.text, marginBottom: 4 }}>Criar conta</h1>
          <p style={{ color: D.muted, fontSize: 13, marginBottom: 24 }}>Preencha seus dados para começar</p>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{ width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: D.text, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Senha</label>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%', background: D.input, border: `1px solid ${D.inputBorder}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: D.text, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: D.red, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, marginTop: 20, color: D.muted }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: D.text, fontWeight: 600, textDecoration: 'underline' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
