import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processarMensagemWhatsApp } from '@/lib/gemini-service';

export const runtime = 'nodejs';

// --- CONFIGURAÇÕES ---
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'finchat123';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FB_API_URL = 'https://graph.facebook.com/v17.0';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- FUNÇÃO AUXILIAR: Baixar Mídia do Facebook ---
async function baixarMidiaFacebook(mediaId: string): Promise<{ data: string, mimeType: string } | null> {
    try {
        const token = process.env.WHATSAPP_API_TOKEN;
        
        // 1. Pega a URL de download
        const urlRes = await fetch(`${FB_API_URL}/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const urlJson = await urlRes.json();
        const mediaUrl = urlJson.url; // URL temporária do binário
        const mimeType = urlJson.mime_type;

        // 2. Baixa o binário
        const binaryRes = await fetch(mediaUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const arrayBuffer = await binaryRes.arrayBuffer();
        
        // 3. Converte para Base64
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        
        return { data: base64, mimeType };
    } catch (e) {
        console.error("Erro download mídia:", e);
        return null;
    }
}

// 1. GET: Verificação
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// 2. POST: Receber Mensagens
export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();

    if (!body || body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 404 });
    }

    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (message) {
      const telefone = message.from; 
      const tipo = message.type; // 'text', 'image', 'audio', etc.
      let respostaIA = "";

      // 1. Identifica Usuário
      const { data: usuario } = await supabaseAdmin
        .from('usuarios_whatsapp')
        .select('user_id')
        .eq('telefone', telefone)
        .single();

      if (!usuario) {
        // Opcional: Responder pedindo cadastro
        return NextResponse.json({ status: 'not_linked' });
      }

      // 2. Processamento por Tipo
      if (tipo === 'text') {
          console.log(`📩 Texto de ${telefone}: ${message.text.body}`);
          respostaIA = await processarMensagemWhatsApp(message.text.body, usuario.user_id);
      } 
      else if (tipo === 'image' || tipo === 'audio') {
          console.log(`📩 Mídia (${tipo}) de ${telefone}`);
          const mediaId = tipo === 'image' ? message.image.id : message.audio.id;
          
          // Baixa a mídia
          const arquivo = await baixarMidiaFacebook(mediaId);
          
          if (arquivo) {
              // Manda pro cérebro com o arquivo anexado
              respostaIA = await processarMensagemWhatsApp(
                  message.caption || null, // Legenda da foto, se houver
                  usuario.user_id,
                  { tipo: tipo, data: arquivo.data, mimeType: arquivo.mimeType }
              );
          } else {
              respostaIA = "❌ Falha ao baixar a mídia do WhatsApp.";
          }
      } else {
          respostaIA = "⚠️ Tipo de mensagem não suportado (apenas Texto, Foto e Áudio).";
      }

      // 3. Responder no WhatsApp
      const phoneId = value.metadata?.phone_number_id;
      const apiToken = process.env.WHATSAPP_API_TOKEN;

      if (phoneId && apiToken && respostaIA) {
        await fetch(`${FB_API_URL}/${phoneId}/messages`, {
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

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}