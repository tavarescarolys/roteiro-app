'use client'
import { LOGO_SRC } from '@/lib/logo'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', input: '#0f0e11', inputBorder: '#3a3740',
  red: '#B7022C',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('voice_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      router.push(profile ? '/generator' : '/onboarding')
    }
  }

  async function handleForgotPassword() {
    if (!forgotEmail) return
    setForgotLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: 'https://gerador.dobolsopratela.com.br/update-password',
    })
    setForgotSent(true)
    setForgotLoading(false)
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

          {!showForgot ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: D.text, marginBottom: 4 }}>Entrar</h1>
              <p style={{ color: D.muted, fontSize: 13, marginBottom: 24 }}>Acesse sua conta para continuar</p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" style={inp} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Senha</label>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                      style={{ fontSize: 12, color: D.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                      Esqueci minha senha
                    </button>
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" style={inp} />
                </div>

                {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}

                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: D.red, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13, marginTop: 20, color: D.muted }}>
                Não tem conta?{' '}
                <Link href="/register" style={{ color: D.text, fontWeight: 600, textDecoration: 'underline' }}>Cadastre-se</Link>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setShowForgot(false); setForgotSent(false) }}
                style={{ background: 'none', border: 'none', color: D.muted, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                ← Voltar
              </button>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: D.text, marginBottom: 4 }}>Redefinir senha</h1>

              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                  <p style={{ color: D.text, fontWeight: 600, marginBottom: 8 }}>Link enviado!</p>
                  <p style={{ color: D.muted, fontSize: 13 }}>Verifique sua caixa de entrada em <strong style={{ color: D.text }}>{forgotEmail}</strong> e clique no link para criar uma nova senha.</p>
                </div>
              ) : (
                <>
                  <p style={{ color: D.muted, fontSize: 13, marginBottom: 24 }}>Informe seu email e enviaremos um link para criar uma nova senha.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: D.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="seu@email.com" style={inp} />
                    </div>
                    <button onClick={handleForgotPassword} disabled={forgotLoading || !forgotEmail}
                      style={{ width: '100%', background: D.red, color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1, opacity: forgotLoading || !forgotEmail ? 0.6 : 1 }}>
                      {forgotLoading ? 'Enviando...' : 'Enviar link'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
