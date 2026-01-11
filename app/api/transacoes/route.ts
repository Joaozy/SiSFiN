import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `
Você é um assistente financeiro pessoal. Responda de forma curta e amigável em Português do Brasil.
Se o usuário pedir para registrar algo, confirme que entendeu os dados (Valor, Categoria, Tipo).
`;

export async function POST(req: Request) {
  try {
    const { message, messages } = await req.json();

    // Configurar mensagens para a IA
    const conversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(messages || []).map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'Chave de API não configurada' }, { status: 500 });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://seu-site.com',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free', // Modelo rápido e gratuito
        messages: conversation,
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não entendi.';

    return NextResponse.json({ response: reply });

  } catch (error: any) {
    console.error('Erro no chat:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}