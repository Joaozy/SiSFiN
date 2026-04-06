import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processarMensagemWhatsApp } from '@/lib/gemini-service';

export const runtime = 'nodejs';

// Conexão com Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Pegar os dados que vêm do n8n
    const { telefone, texto, midia } = body;

    // 🧹 LIMPEZA DO FORMATO DO ARQUIVO (A CORREÇÃO ESTÁ AQUI)
    if (midia && midia.mimeType) {
      // Transforma "audio/ogg; codecs=opus" em apenas "audio/ogg"
      midia.mimeType = midia.mimeType.split(';')[0].trim();
    }

    console.log('\n================ INÍCIO DO WEBHOOK ================');
    console.log(`📱 TELEFONE: "${telefone}"`);
    console.log(`💬 TEXTO: "${texto}"`);
    console.log(`📎 TEM MÍDIA?: ${midia ? `Sim (${midia.mimeType})` : 'Não'}`);
    
    const { data: usuario, error: erroUsuario } = await supabaseAdmin
      .from('usuarios_whatsapp')
      .select('user_id, telefone')
      .eq('telefone', String(telefone))
      .single();

    if (erroUsuario) {
      console.log('⚠️ ERRO NA BUSCA DO USUÁRIO:', erroUsuario.message);
    } 

    let respostaTexto = "";
    let linkPdf: string | undefined = undefined;

    if (!usuario) {
      respostaTexto = "Olá! Não encontrei o seu registo. Por favor, aceda à nossa aplicação para criar a sua conta.";
    } else {
      // Enviar o texto e a mídia para o Gemini processar
      // 🚀 AGORA O SERVIÇO RETORNA { texto: string, pdfUrl?: string }
      const respostaIA = await processarMensagemWhatsApp(texto, usuario.user_id, midia);
      
      if (typeof respostaIA === 'object' && respostaIA !== null) {
         respostaTexto = respostaIA.texto;
         linkPdf = respostaIA.pdfUrl;
      } else {
         // Fallback de segurança caso a IA retorne apenas string
         respostaTexto = respostaIA as string;
      }
    }

    console.log('🤖 RESPOSTA IA GERADA:', respostaTexto);
    if (linkPdf) console.log('📄 PDF GERADO:', linkPdf);
    console.log('=================================================\n');

    // Retorna a resposta para o n8n
    return NextResponse.json({
      sucesso: true,
      respostaWhatsapp: respostaTexto,
      arquivoUrl: linkPdf || null // 🚀 ENVIANDO O LINK PARA O N8N
    });

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}