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
    const { telefone, mensagem } = body;

    console.log('\n================ INÍCIO DO TESTE ================');
    console.log(`📱 1. TELEFONE RECEBIDO: "${telefone}" (Tipo: ${typeof telefone}, Tamanho: ${String(telefone).length})`);
    
    // TESTE A: Tentar ler qualquer coisa da tabela (Prova de Conexão)
    const { data: todosUsuarios, error: erroTodos } = await supabaseAdmin
      .from('usuarios_whatsapp')
      .select('telefone, user_id')
      .limit(3);

    if (erroTodos) {
      console.log('❌ 2. ERRO DE CONEXÃO/PERMISSÃO NO SUPABASE:', erroTodos.message);
    } else {
      console.log('✅ 2. CONEXÃO BEM SUCEDIDA. Alguns números no banco:', todosUsuarios);
    }

    // TESTE B: A busca exata pelo seu número
    const { data: usuario, error: erroUsuario } = await supabaseAdmin
      .from('usuarios_whatsapp')
      .select('user_id, telefone')
      .eq('telefone', String(telefone))
      .single();

    if (erroUsuario) {
      console.log('⚠️ 3. ERRO NA BUSCA EXATA (Single):', erroUsuario.message, erroUsuario.details);
    } else {
      console.log('✅ 3. USUÁRIO ENCONTRADO COM SUCESSO! Dados:', usuario);
    }
    console.log('=================================================\n');

    let respostaIA = "";

    if (!usuario) {
      respostaIA = "Olá! Não encontrei o seu registo. Por favor, aceda à nossa aplicação para vincular o seu número.";
    } else {
      respostaIA = await processarMensagemWhatsApp(mensagem, usuario.user_id);
    }

    return NextResponse.json({
      sucesso: true,
      respostaWhatsapp: respostaIA
    });

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}