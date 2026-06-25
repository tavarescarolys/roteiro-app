'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type AccessCode = {
  id: string
  code: string
  used_by: string | null
  used_at: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [quantity, setQuantity] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (!user || user.email !== adminEmail) {
        router.push('/generator')
        return
      }
      setAuthorized(true)
      loadCodes()
    }
    checkAuth()
  }, [])

  async function loadCodes() {
    const res = await fetch('/api/admin/codes')
    const data = await res.json()
    setCodes(data.codes || [])
    setLoading(false)
  }

  async function generateCodes() {
    setGenerating(true)
    setError('')
    const res = await fetch('/api/admin/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    })
    if (res.ok) {
      await loadCodes()
    } else {
      setError('Erro ao gerar códigos.')
    }
    setGenerating(false)
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Painel Admin</h1>

        {/* Generate codes */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Gerar códigos de acesso</h2>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm w-24 outline-none focus:ring-2 focus:ring-black"
            />
            <span className="text-sm text-gray-500">códigos</span>
            <button
              onClick={generateCodes}
              disabled={generating}
              className="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {generating ? 'Gerando...' : 'Gerar'}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* Codes list */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold mb-4">Códigos ({codes.length})</h2>

          {loading && <p className="text-gray-400 text-sm">Carregando...</p>}

          <div className="flex flex-col gap-2">
            {codes.map(c => (
              <div key={c.id} className="flex items-center justify-between border rounded-lg px-4 py-3 text-sm">
                <span className="font-mono font-medium tracking-widest">{c.code}</span>
                <div className="flex items-center gap-3">
                  {c.used_by ? (
                    <>
                      <span className="text-xs text-gray-400">
                        {new Date(c.used_at!).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-medium">Usado</span>
                    </>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">Disponível</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
