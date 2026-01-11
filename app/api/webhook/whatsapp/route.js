import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processarMensagemWhatsApp } from '@/lib/gemini-service';

export const runtime = 'nodejs';

// Configurações
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'finchat123';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente Supabase
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// 1. GET: Verificação do Facebook
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    // Retorna o challenge como texto puro (obrigatório pelo Facebook)
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// 2. POST: Receber Mensagens
export async function POST(req: NextRequest) {
  try {
    // O uso de 'any' aqui elimina os erros de tipagem estrita do TypeScript
    const body: any = await req.json();

    // Verificação de segurança básica
    if (!body || body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const telefone = message.from; // Número do remetente
      const texto = message.text?.body; // Conteúdo da mensagem

      console.log(`📩 Webhook recebeu de ${telefone}: ${texto}`);

      if (texto) {
        // 1. Buscar usuário no banco
        const { data: usuario, error } = await supabaseAdmin
          .from('usuarios_whatsapp')
          .select('user_id')
          .eq('telefone', telefone)
          .single();

        if (error || !usuario) {
          console.warn(`⚠️ Telefone ${telefone} não vinculado.`);
          return NextResponse.json({ status: 'not_linked' });
        }

        // 2. Processar mensagem com a IA
        const respostaIA = await processarMensagemWhatsApp(texto, usuario.user_id);

        // 3. Responder no WhatsApp
        const phoneId = value.metadata?.phone_number_id;
        const apiToken = process.env.WHATSAPP_API_TOKEN;

        if (phoneId && apiToken) {
          await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: telefone,
              text: { body: respostaIA },
            }),
          });
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('❌ Erro no Webhook:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}