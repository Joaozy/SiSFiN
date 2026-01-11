import { createClient } from '@supabase/supabase-js'; // ⚠️ Note: supabase-js, NÃO ssr
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    // 1. Pega o Token que o Front enviou
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error("❌ [API] Sem token no header");
      return NextResponse.json({ error: 'Token ausente' }, { status: 401 });
    }

    // 2. Cria cliente "burro" (sem cookies) apenas com o Token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    // 3. Verifica o usuário usando esse Token
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("❌ [API] Token inválido ou expirado:", error);
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    // Se chegou aqui, o usuário existe e está autenticado!
    console.log("✅ [API] Usuário autenticado via Token:", user.email);

    // ... (RESTO DO CÓDIGO DA IA: Fetch OpenRouter, Stream, etc.)
    // ... Copie o restante da lógica do OpenRouter do arquivo anterior ...
    // ... Se quiser, eu mando o arquivo completo de novo abaixo ...

    // --- CÓDIGO RESUMIDO DO RESTANTE PARA CABER AQUI ---
    const { messages } = await req.json();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
       method: 'POST',
       headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
       },
       body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: messages, // Lembre de adicionar o SYSTEM_PROMPT aqui
        stream: true,
        // ... tools ...
       })
    });
    
    // ... Tratar Stream ...
    // Só para garantir que você tenha o código completo, vou resumir o retorno:
    return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream' }}); 
    // (Nota: No seu código final use o tratamento de stream completo que mandei antes para salvar no banco)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}