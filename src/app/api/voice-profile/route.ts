import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { transcription } = await req.json()

    if (!transcription?.trim()) {
      return NextResponse.json({ error: 'Transcrição vazia.' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Você vai analisar a transcrição de áudio de um criador de conteúdo brasileiro e extrair o perfil de voz REAL dele — não descrições genéricas, mas padrões concretos e replicáveis.

Transcrição:
${transcription}

Extraia e documente exatamente:

1. EXPRESSÕES PRÓPRIAS: palavras, gírias, interjeições e frases que essa pessoa usa e que são características dela. Liste com exemplos diretos do texto.

2. RITMO DE FRASE: as frases são curtas e diretas? Longas e explicativas? Ela faz pausas com "né", "sabe", "tipo"? Usa reticências no raciocínio?

3. COMO INICIA IDEIAS: como ela começa um argumento ou ponto novo? Com pergunta? Com afirmação? Com exemplo?

4. COMO CONCLUI: como ela fecha um raciocínio? Com conselho direto? Com pergunta reflexiva? Com dado?

5. NÍVEL DE INTIMIDADE: ela trata o ouvinte como amigo, como aluno, como igual? Usa "você", "a gente", "vocês"?

6. PADRÕES A IMITAR: liste 3 a 5 frases ou construções extraídas diretamente da transcrição que devem ser usadas como referência de tom e estilo ao escrever roteiros para essa pessoa.

Seja específico. Use exemplos reais do texto. Não use adjetivos genéricos como "descontraído" ou "informal" sem mostrar o que isso significa na prática.`,
        },
      ],
    })

    const profile = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ profile })
  } catch (err: any) {
    console.error('voice-profile error:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'Erro ao analisar perfil.' }, { status: 500 })
  }
}
