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

    // 🧹 LIMPEZA DO FORMATO DO ARQUIVO
    if (midia && midia.mimeType) {
      midia.mimeType = midia.mimeType.split(';')[0].trim();
    }

    // 🛡️ TRATAMENTO DO NONO DÍGITO (BRASIL)
    let foneLimpo = String(telefone).replace(/\D/g, ''); // Remove +, -, espaços
    let numerosParaBuscar = [foneLimpo];

    // Se for um número do Brasil (DDD 55), geramos as duas possibilidades
    if (foneLimpo.startsWith('55')) {
        if (foneLimpo.length === 12) {
            // Está sem o 9 (ex: 55 79 88887777) -> Cria a versão com o 9
            numerosParaBuscar.push(`55${foneLimpo.substring(2, 4)}9${foneLimpo.substring(4)}`);
        } else if (foneLimpo.length === 13) {
            // Está com o 9 (ex: 55 79 988887777) -> Cria a versão sem o 9
            numerosParaBuscar.push(`55${foneLimpo.substring(2, 4)}${foneLimpo.substring(5)}`);
        }
    }

    console.log('\n================ INÍCIO DO WEBHOOK ================');
    console.log(`📱 TELEFONE ORIGINAL: "${telefone}"`);
    console.log(`🔍 BUSCANDO NO BANCO POR:`, numerosParaBuscar);
    console.log(`💬 TEXTO: "${texto}"`);
    console.log(`📎 TEM MÍDIA?: ${midia ? `Sim (${midia.mimeType})` : 'Não'}`);
    
    // 🚀 Busca o usuário testando as duas versões do número e traz TODAS as colunas (*)
    const { data: usuarios, error: erroUsuario } = await supabaseAdmin
      .from('usuarios_whatsapp')
      .select('*') 
      .in('telefone', numerosParaBuscar)
      .limit(1);

    const usuario = usuarios && usuarios.length > 0 ? usuarios[0] : null;

    if (erroUsuario) {
      console.log('⚠️ ERRO NA BUSCA DO USUÁRIO:', erroUsuario.message);
    } 

    let respostaTexto = "";
    let linkPdf: string | undefined = undefined;

    if (!usuario) {
      // Se não achar nenhuma das versões, aí sim é usuário novo!
      const respostaIA = await processarMensagemWhatsApp(texto, String(numerosParaBuscar[0]), null, midia);
      respostaTexto = typeof respostaIA === 'object' ? respostaIA.texto : respostaIA as string;
    } else {
      // 🚀 Encontrou! Passa a bola para o Cérebro 2 (Financeiro)
      const respostaIA = await processarMensagemWhatsApp(texto, usuario.telefone, usuario, midia);
      
      if (typeof respostaIA === 'object' && respostaIA !== null) {
         respostaTexto = respostaIA.texto;
         linkPdf = respostaIA.pdfUrl;
      } else {
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
      arquivoUrl: linkPdf || null 
    });

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}