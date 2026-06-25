'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Erro ao cadastrar.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    await supabase.auth.signInWithPassword({ email, password })
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-sm rounded-2xl shadow p-8" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#e5e5e5' }}>Criar conta</h1>
        <p className="text-sm mb-6" style={{ color: '#888' }}>Use seu código de acesso para se cadastrar</p>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#ccc' }}>Código de acesso</label>
            <input type="text" required value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono tracking-widest"
              style={{ background: '#111', border: '1px solid #333', color: '#e5e5e5' }}
              placeholder="XXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#ccc' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: '#111', border: '1px solid #333', color: '#e5e5e5' }}
              placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#ccc' }}>Senha</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: '#111', border: '1px solid #333', color: '#e5e5e5' }}
              placeholder="Mínimo 6 caracteres" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ background: '#fff', color: '#000' }}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#666' }}>
          Já tem conta?{' '}
          <Link href="/login" className="font-medium underline" style={{ color: '#e5e5e5' }}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
