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

    const prompt = `Você é um roteirista especialista em psicologia do comportamento aplicada a vídeos curtos para criadores de conteúdo brasileiros. Sua função é gerar roteiros que soem como a pessoa falando de verdade — não como texto de IA, não como redação, não como apresentação corporativa.

REGRAS DE ESCRITA (siga à risca):
- Frases curtas. Uma ideia por vez.
- Linguagem coloquial brasileira. Como se fosse uma conversa.
- PROIBIDO usar: "mergulhar", "jornada", "incrível", "transformar", "absolutamente", "certamente", "é fundamental", "no mundo atual", "nos dias de hoje", "é importante ressaltar", "em suma", "portanto".
- Sem introduções longas. Vai direto ao ponto.
- Imite o ritmo e o vocabulário do perfil de voz abaixo.

PRINCÍPIOS PSICOLÓGICOS QUE DEVEM ESTAR PRESENTES NO ROTEIRO:

1. GANCHO COM LOOP ABERTO (Zeigarnik Effect): comece com uma pergunta, afirmação ou situação que cria tensão e só se resolve no final. O cérebro não consegue ignorar algo inacabado — use isso. Ex: "Eu errei isso por 2 anos. E você provavelmente está errando agora."

2. DOR ANTES DO GANHO (Loss Aversion): mencione o que a pessoa está perdendo ou arriscando se não agir. Perdas pesam o dobro de ganhos. Não venda a solução antes de nomear o problema com precisão.

3. BENEFÍCIO IMEDIATO (Hyperbolic Discounting): o público responde a benefícios que podem sentir agora, não em 6 meses. Use linguagem de resultado rápido e concreto. "Hoje", "agora", "essa semana" funcionam.

4. PROVA SOCIAL IMPLÍCITA: quando possível, inclua referências a situações, comportamentos ou erros que muita gente comete — isso faz o espectador se identificar e sentir que não está sozinho.

5. ENCERRAMENTO MEMORÁVEL (Peak-End Rule): o final do vídeo é o que fica. Feche com uma frase que provoca reflexão, dá um micro-compromisso ou cria urgência para agir. Nunca termine com "espero que tenha gostado".

6. MICRO-COMPROMISSO NO CTA (Commitment & Consistency): o call to action deve pedir algo pequeno primeiro — salvar, comentar, responder uma pergunta — antes de pedir follow ou compra.

ESTRUTURA OBRIGATÓRIA:
1. GANCHO (1 frase — primeiros 3 segundos): pergunta que dói, afirmação que surpreende ou situação que o público reconhece e cria loop aberto.
2. PROBLEMA: nomeie a dor com precisão. O que a pessoa está perdendo ou sofrendo.
3. CONTEÚDO: desenvolva no estilo do criador. Mostre o caminho, dê a informação, conte a história.
4. VIRADA: o insight, a sacada, o ângulo diferente.
5. FECHAMENTO + CTA: encerramento memorável com micro-compromisso.

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
