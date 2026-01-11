import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Mudamos para nodejs para garantir compatibilidade total com o Supabase Auth
export const runtime = 'nodejs';

const SYSTEM_PROMPT = `
Você é um assistente financeiro pessoal consultivo (FinChat Simples). 
Responda sempre em Português do Brasil de forma curta, amigável e direta.

IMPORTANTE: Você NÃO tem permissão para registrar transações neste chat.
Se o usuário tentar registrar um gasto ou ganho, avise gentilmente:
"Para registrar transações, por favor utilize a aba 'Agente Avançado' ou 'Novo Registro', pois por aqui sou apenas um chat de consulta rápida."
`;

export async function POST(req: Request) {
  try {
    // 1. Verificação de Segurança (Autenticação)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // 2. Receber dados do Frontend
    const { message, messages } = await req.json();

    // 3. Montar histórico para a IA
    const conversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(messages || []).map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    // 4. Verificar Chave de API
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'Chave de API não configurada' }, { status: 500 });
    }

    // 5. Chamar OpenRouter (Gemini Profissional)
    // Atualizado para o mesmo modelo potente do agente avançado para manter a qualidade
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'FinChat Simples',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Modelo Atualizado e Profissional
        messages: conversation,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Erro OpenRouter:', err);
      throw new Error('Falha na comunicação com a IA');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua resposta.';

    return NextResponse.json({ response: reply });

  } catch (error: any) {
    console.error('Erro no endpoint chat:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}