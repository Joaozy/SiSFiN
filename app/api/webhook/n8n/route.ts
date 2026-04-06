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
    
    // 🚨 CORREÇÃO 1: Pegar os nomes corretos que vêm do n8n (texto e midia)
    const { telefone, texto, midia } = body;

    console.log('\n================ INÍCIO DO WEBHOOK ================');
    console.log(`📱 TELEFONE: "${telefone}"`);
    console.log(`💬 TEXTO: "${texto}"`);
    console.log(`📎 TEM MÍDIA?: ${midia ? 'Sim (Áudio ou Imagem recebidos)' : 'Não'}`);
    
    const { data: usuario, error: erroUsuario } = await supabaseAdmin
      .from('usuarios_whatsapp')
      .select('user_id, telefone')
      .eq('telefone', String(telefone))
      .single();

    if (erroUsuario) {
      console.log('⚠️ ERRO NA BUSCA DO USUÁRIO:', erroUsuario.message);
    } 

    let respostaIA = "";

    if (!usuario) {
      respostaIA = "Olá! Não encontrei o seu registo. Por favor, aceda à nossa aplicação para criar a sua conta.";
    } else {
      // 🚨 CORREÇÃO 2: Enviar o texto e a mídia para o Gemini processar
      respostaIA = await processarMensagemWhatsApp(texto, usuario.user_id, midia);
    }

    console.log('🤖 RESPOSTA IA GERADA:', respostaIA);
    console.log('=================================================\n');

    // Retorna a resposta para o n8n
    return NextResponse.json({
      sucesso: true,
      respostaWhatsapp: respostaIA
    });

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}