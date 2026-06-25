import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { code, email, password } = await req.json()

  if (!code || !email || !password) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check code
  const { data: accessCode, error: codeError } = await supabase
    .from('access_codes')
    .select('id, used_by')
    .eq('code', code.toUpperCase())
    .single()

  if (codeError || !accessCode) {
    return NextResponse.json({ error: 'Código de acesso inválido.' }, { status: 400 })
  }

  if (accessCode.used_by) {
    return NextResponse.json({ error: 'Código já utilizado.' }, { status: 400 })
  }

  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Erro ao criar conta.' }, { status: 400 })
  }

  // Mark code as used
  await supabase
    .from('access_codes')
    .update({ used_by: authData.user.id, used_at: new Date().toISOString() })
    .eq('id', accessCode.id)

  return NextResponse.json({ success: true })
}
