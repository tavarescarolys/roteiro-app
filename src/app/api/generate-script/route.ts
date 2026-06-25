import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { platform, theme, duration, objective, sentimento } = await req.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: voiceProfile } = await supabase
      .from('voice_profiles')
      .select('profile_text')
      .eq('user_id', user.id)
      .single()

    if (!voiceProfile) {
      return NextResponse.json({ error: 'Perfil de voz não encontrado.' }, { status: 400 })
    }

    const prompt = `Você é um roteirista que escreve para criadores de conteúdo brasileiros. Sua função é gerar roteiros que soem como a pessoa falando de verdade — não como texto de IA, não como redação, não como apresentação corporativa.

REGRAS DE ESCRITA (siga à risca):
- Frases curtas. Uma ideia por vez.
- Linguagem coloquial brasileira. Como se fosse uma conversa.
- PROIBIDO usar: "mergulhar", "jornada", "incrível", "transformar", "absolutamente", "certamente", "é fundamental", "no mundo atual", "nos dias de hoje", "é importante ressaltar", "em suma", "portanto".
- Sem introduções longas. Vai direto ao ponto.
- Imite o ritmo e o vocabulário do perfil de voz abaixo.

ESTRUTURA OBRIGATÓRIA:
1. Comece com um GANCHO de 1 frase que prende nos primeiros 3 segundos. Pode ser uma pergunta que dói, uma afirmação que surpreende, ou uma situação que o público reconhece na hora.
2. Desenvolva o conteúdo no estilo combinado.
3. Feche com uma frase de ação ou reflexão curta.

CLASSIFICAÇÃO E FORMATO — siga exatamente, sem exceções:
- Falas (o que o criador fala na câmera): [EMOÇÃO] texto da fala — use [URGÊNCIA], [NEUTRO], [CALMO] ou [ALEGRIA]
- Orientações de gravação (corte, pausa, expressão, câmera): (ORIENTAÇÃO) descrição
- Uma linha por bloco.
- PROIBIDO: títulos com #, texto em **negrito**, linhas com ---, metadados como "Duração estimada", "Palavras aproximadas" ou qualquer linha que não seja fala ou orientação.

Perfil de voz do criador:
${voiceProfile.profile_text}

Briefing:
${theme}

Plataforma: ${platform}
Duração: ${duration}
Objetivo: ${objective}
Sentimento geral do vídeo: ${sentimento}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    await supabase.from('scripts').insert({
      user_id: user.id,
      platform,
      theme,
      duration,
      objective,
      content,
    })

    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('generate-script error:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Erro ao gerar roteiro.' }, { status: 500 })
  }
}
