import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos admin para rodar em background sem sessão do usuário
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesAtual = hoje.getMonth(); // 0 = Janeiro
    const anoAtual = hoje.getFullYear();

    // 1. Buscar contas ativas que vencem hoje ou antes e ainda não foram geradas este mês
    const { data: recorrentes, error } = await supabaseAdmin
      .from('gastos_recorrentes')
      .select('*')
      .eq('ativo', true)
      .lte('dia_vencimento', diaHoje); // Vence hoje ou já passou

    if (error) throw error;

    let gerados = 0;

    for (const item of recorrentes) {
      const dataUltima = item.ultima_geracao ? new Date(item.ultima_geracao) : null;
      
      // Verifica se já foi gerado neste mês/ano
      const jaGerouEsteMes = dataUltima && 
                             dataUltima.getMonth() === mesAtual && 
                             dataUltima.getFullYear() === anoAtual;

      if (!jaGerouEsteMes) {
        // CRIAR A TRANSAÇÃO
        await supabaseAdmin.from('transacoes').insert({
            usuario_id: item.usuario_id,
            descricao: `${item.descricao} (Recorrente)`,
            valor: item.valor,
            tipo: 'despesa',
            categoria: item.categoria,
            metodo_pagamento: 'Recorrente',
            data: new Date().toISOString()
        });

        // ATUALIZAR A DATA DA ÚLTIMA GERAÇÃO
        await supabaseAdmin
            .from('gastos_recorrentes')
            .update({ ultima_geracao: new Date().toISOString() })
            .eq('id', item.id);

        gerados++;
      }
    }

    return NextResponse.json({ 
        success: true, 
        mensagem: `${gerados} contas recorrentes processadas.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}