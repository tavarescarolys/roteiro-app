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

    const algorithmRules: Record<string, string> = {
      'Reels': `━━━ ALGORITMO DO INSTAGRAM REELS ━━━
RETENÇÃO É TUDO — o algoritmo mede assistência completa e replays.
- 0–3s (GANCHO VISUAL + VERBAL): primeira frase deve causar ruptura — pergunta inesperada, afirmação contraintuitiva ou número específico. O espectador decide ficar nos primeiros 2 segundos.
- 3–10s (DOR/TENSÃO): aprofunda o problema sem dar a solução ainda. Loop aberto ativo.
- 10–(fim-10s) (VALOR): entrega o conteúdo de forma densa, sem enrolação.
- Últimos 10s (VIRADA + CTA): encerramento que provoca salvar ("salva esse vídeo pra não esquecer") ou comentar ("comenta aqui X ou Y").
SINAIS QUE O ALGORITMO MAIS VALORIZA: salvamentos > compartilhamentos > comentários > curtidas.
O CTA deve pedir SALVAR ou COMPARTILHAR — não curtida.
DURAÇÃO IDEAL: 7–30s para alcance máximo. Acima de 60s só se o watch-through for garantido.
LOOP: se possível, o último frame conecta com o primeiro (faz o vídeo parecer que continua).`,

      'TikTok': `━━━ ALGORITMO DO TIKTOK ━━━
TAXA DE CONCLUSÃO É O FATOR #1 — vídeos que as pessoas assistem até o fim (ou relembram) são empurrados para mais pessoas.
- 0–2s (HOOK VERBAL): primeira palavra já prende. Use "Ninguém te conta isso", "Isso mudou tudo pra mim", "Você tá errando aqui".
- Cada 7–10s: PAUSA RÍTMICA ou mudança de tom/assunto para resetar atenção (pattern interrupt).
- Penúltima frase: setup de curiosidade que só resolve na última frase.
- Última frase: CTA que gera comentário ("comenta se você também faz isso") ou dueto/stitch.
SINAIS QUE O ALGORITMO MAIS VALORIZA: conclusão do vídeo > replay > compartilhamento via DM > comentário.
DURAÇÃO IDEAL: 15–45s. Evite pausas, silêncios ou devagar — o TikTok penaliza drop-off precoce.
LOOP: termine com frase ou som que convida ao replay.`,

      'YouTube': `━━━ ALGORITMO DO YOUTUBE SHORTS ━━━
RETENÇÃO E CTR — YouTube prioriza vídeos que fazem as pessoas clicarem E ficam.
- 0–3s: promessa clara do que o espectador vai aprender/sentir. Não enrole.
- Estrutura: problema → desenvolvimento → resolução → CTA de inscrição ou próximo vídeo.
- CTA: peça para se inscrever OU ver outro vídeo (não os dois). Vídeos relacionados aumentam tempo de sessão.
SINAIS QUE O ALGORITMO MAIS VALORIZA: watch-through rate > cliques em próximos vídeos > likes > comentários.
DURAÇÃO IDEAL: 30–60s para Shorts. Acima disso, garanta ritmo constante.`,
    }

    const platformRule = algorithmRules[platform] || algorithmRules['Reels']

    const prompt = `Você é um ghost-writer especialista em conteúdo de alto desempenho para redes sociais brasileiras. Sua missão dupla: escrever EXATAMENTE como essa pessoa fala E seguir as diretrizes do algoritmo da plataforma para maximizar alcance.

━━━ PERFIL DE VOZ — REGRA #1, INEGOCIÁVEL ━━━
${voiceProfile.profile_text}

APLICAÇÃO OBRIGATÓRIA:
- Use as expressões, gírias e vícios de linguagem listados acima LITERALMENTE
- Replique o ritmo: se a pessoa fala curto, escreva curto; se usa "né", "sabe", "tipo", use
- Inicie e conclua os raciocínios do jeito que ela faz, não do jeito que você faria
- Se o perfil tem frases de referência, use construções idênticas ou muito próximas
- TESTE FINAL: alguém que conhece essa pessoa deve ouvir e dizer "é exatamente ela falando"

━━━ PROIBIÇÕES ABSOLUTAS DE VOZ ━━━
NUNCA use: "mergulhar", "jornada", "incrível", "transformar", "potencializar", "alavancar", "absolutamente", "certamente", "é fundamental", "no mundo atual", "nos dias de hoje", "é importante ressaltar", "em suma", "portanto", "nesse sentido", "dado isso", "vale ressaltar", "impactar", "entregar valor".
Sem metáforas genéricas. Sem frases de coach motivacional. Sem introdução longa que não prende.

${platformRule}

━━━ PRINCÍPIOS DE COPY APLICADOS AO ALGORITMO ━━━
1. ESPECIFICIDADE — troque o vago pelo concreto.
   ❌ "muitas pessoas erram nisso"  ✅ "9 em cada 10 que eu atendo fazem exatamente isso"

2. LOOP ABERTO NO GANCHO (Efeito Zeigarnik) — 1 frase que cria tensão que só resolve no fim.
   ❌ "hoje vou falar sobre X"  ✅ "eu perdi cliente por causa disso e só entendi depois"

3. DOR ANTES DA SOLUÇÃO (Aversão à Perda) — perca potencial pesa mais que ganho potencial.

4. BENEFÍCIO IMEDIATO — resultado sentido hoje, não em 6 meses.

5. PADRÃO DE FRASE CURTA → MÉDIA — alterna para manter ritmo e evitar drop-off.

6. CTA ORIENTADO AO ALGORITMO — peça exatamente o sinal que a plataforma mais valoriza (ver acima).

━━━ ESTRUTURA DO ROTEIRO ━━━
1. GANCHO (0–3s): 1 frase. Loop aberto. Pára o scroll.
2. TENSÃO (3–10s): aprofunda o problema sem dar resposta ainda.
3. CONTEÚDO (meio): entrega o valor no estilo do criador. Denso, sem enrolação.
4. VIRADA: a sacada, o ângulo diferente que justifica o vídeo existir.
5. FECHAMENTO + CTA: última frase memorável + 1 pedido alinhado ao algoritmo da plataforma.

━━━ FORMATO — sem exceção ━━━
- Falas: [EMOÇÃO] texto — use [URGÊNCIA], [NEUTRO], [CALMO] ou [ALEGRIA]
- Orientações de gravação/edição: (ORIENTAÇÃO) descrição
- Uma linha por bloco
- PROIBIDO: #títulos, **negrito**, ---, "Duração estimada", qualquer linha que não seja fala ou orientação

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
