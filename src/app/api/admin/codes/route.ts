import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === process.env.ADMIN_EMAIL ? user : null
}

export async function GET() {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: codes } = await supabase
    .from('access_codes')
    .select('id, code, used_by, used_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ codes: codes || [] })
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })

  const { quantity } = await req.json()
  const count = Math.min(Math.max(1, quantity || 5), 100)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const newCodes = Array.from({ length: count }, () => ({ code: generateCode() }))
  await supabase.from('access_codes').insert(newCodes)

  return NextResponse.json({ success: true, count })
}
