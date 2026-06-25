'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    // Check if user has voice profile
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f0f' }}>
      <div className="w-full max-w-sm rounded-2xl shadow p-8" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#e5e5e5' }}>Entrar</h1>
        <p className="text-sm mb-6" style={{ color: '#888' }}>Acesse sua conta para continuar</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#ccc' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: '#111', border: '1px solid #333', color: '#e5e5e5' }}
              placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#ccc' }}>Senha</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: '#111', border: '1px solid #333', color: '#e5e5e5' }}
              placeholder="••••••••" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ background: '#fff', color: '#000' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#666' }}>
          Não tem conta?{' '}
          <Link href="/register" className="font-medium underline" style={{ color: '#e5e5e5' }}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
