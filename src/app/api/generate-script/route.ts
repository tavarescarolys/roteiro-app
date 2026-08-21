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

    const prompt = `Você é um ghost-writer que escreve roteiros para criadores de conteúdo brasileiros. Sua única missão: escrever exatamente como essa pessoa fala — não como você escreve, não como um redator profissional, não como texto de IA.

━━━ PERFIL DE VOZ — ESTA É A LEI ━━━
${voiceProfile.profile_text}

APLICAÇÃO OBRIGATÓRIA DO PERFIL:
- Use as expressões e gírias listadas acima literalmente no roteiro
- Replique o ritmo de frase descrito — se ela fala curto, escreva curto; se usa "né" e "sabe", use
- Inicie e conclua os raciocínios do jeito que ela faz, não do jeito que você faria
- Se o perfil tem frases de referência, use construções idênticas ou muito próximas
- TESTE: alguém que conhece essa pessoa deve ler e dizer "parece ela falando"

━━━ PROIBIÇÕES ABSOLUTAS ━━━
Nunca use: "mergulhar", "jornada", "incrível", "transformar", "potencializar", "alavancar", "absolutamente", "certamente", "é fundamental", "no mundo atual", "nos dias de hoje", "é importante ressaltar", "em suma", "portanto", "nesse sentido", "dado isso", "vale ressaltar".
Sem metáforas genéricas. Sem frases motivacionais vazias. Sem introdução longa.

━━━ PRINCÍPIOS DE COPY QUE DEVEM GUIAR O ROTEIRO ━━━

1. ESPECIFICIDADE: troque o vago pelo concreto.
   ❌ "muitas pessoas cometem erros"
   ✅ "9 em cada 10 pessoas que eu converso fazem exatamente isso"

2. VOZ ATIVA + DIRETO: sujeito age, não sofre ação.
   ❌ "é necessário que seja feita uma mudança"
   ✅ "você precisa mudar isso agora"

3. LINGUAGEM DO PÚBLICO: use as palavras que o público-alvo usa para descrever o próprio problema — não as palavras técnicas do especialista.

4. GANCHO COM LOOP ABERTO (Zeigarnik): 1 frase que cria tensão e só resolve no final. "Eu fiz isso errado por 2 anos. E aposto que você também."

5. DOR ANTES DA SOLUÇÃO (Loss Aversion): nomeie o problema com precisão antes de mostrar a saída. Perdas pesam o dobro de ganhos.

6. BENEFÍCIO IMEDIATO: resultado que a pessoa sente hoje, não em 6 meses. Use "agora", "hoje", "essa semana".

7. ENCERRAMENTO QUE FICA (Peak-End Rule): última frase provoca reflexão ou ação. Nunca "espero que tenha gostado".

8. CTA PEQUENO: peça uma coisa só — salvar, comentar, responder uma pergunta. Micro-compromisso.

━━━ ESTRUTURA OBRIGATÓRIA ━━━
1. GANCHO (1 frase, 3 segundos): loop aberto que prende
2. PROBLEMA: dor nomeada com precisão, o que está perdendo
3. CONTEÚDO: informação/história no estilo do criador
4. VIRADA: a sacada, o ângulo diferente
5. FECHAMENTO + CTA: encerramento memorável + micro-compromisso

━━━ FORMATO — sem exceção ━━━
- Falas: [EMOÇÃO] texto — use [URGÊNCIA], [NEUTRO], [CALMO] ou [ALEGRIA]
- Orientações de gravação: (ORIENTAÇÃO) descrição
- Uma linha por bloco
- PROIBIDO: #títulos, **negrito**, ---, "Duração estimada", "Palavras aproximadas", qualquer linha que não seja fala ou orientação

━━━ BRIEFING ━━━
${theme}

Plataforma: ${platform}
Duração: ${duration}
Objetivo: ${objective}
Sentimento: ${sentimento}`

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
