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
          content: `Analise o texto abaixo e extraia o perfil de comunicação do falante: tom de voz, vocabulário predominante, ritmo e expressões características. Seja conciso e direto.\n\nTexto:\n${transcription}`,
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
