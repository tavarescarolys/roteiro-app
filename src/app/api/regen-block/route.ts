import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { blockText, emotion, fullScript } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: voiceProfile } = await supabase
      .from('voice_profiles')
      .select('profile_text')
      .eq('user_id', user.id)
      .single()

    if (!voiceProfile) return NextResponse.json({ error: 'Perfil de voz não encontrado.' }, { status: 400 })

    const prompt = `Você é um ghost-writer que reescreve trechos de roteiro mantendo a voz do criador.

━━━ PERFIL DE VOZ — ESTA É A LEI ━━━
${voiceProfile.profile_text}

━━━ CONTEXTO DO ROTEIRO COMPLETO ━━━
${fullScript}

━━━ TRECHO A REESCREVER ━━━
Emoção: [${emotion}]
Texto atual: ${blockText}

━━━ TAREFA ━━━
Reescreva APENAS esse trecho com uma abordagem diferente — nova construção de frase, outro ângulo, mas mantendo:
- A mesma emoção [${emotion}]
- O mesmo propósito dentro do roteiro
- A voz e expressões do perfil acima

━━━ FORMATO ━━━
Responda SOMENTE com o novo texto do trecho, sem marcações, sem explicações, sem [EMOÇÃO] no início.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const newText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ text: newText })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao regerar trecho.' }, { status: 500 })
  }
}
