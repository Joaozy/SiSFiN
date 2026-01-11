import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Processa gastos recorrentes automaticamente
 * Verifica se há gastos agendados para HOJE que ainda não foram lançados
 */
export async function POST() {
  const supabase = await createClient();
  
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const dataHojeISO = hoje.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // 1. Obter todos os gastos ativos para o dia de hoje
    const { data: gastosRecorrentes, error: errorGastos } = await supabase
      .from('gastos_mensais')
      .select('*')
      .eq('activo', true)
      .eq('dia_cobranca', diaAtual);

    if (errorGastos) {
      return NextResponse.json({ error: errorGastos.message }, { status: 500 });
    }

    if (!gastosRecorrentes || gastosRecorrentes.length === 0) {
      return NextResponse.json({
        message: 'Nenhum gasto recorrente para processar hoje',
        procesados: 0
      });
    }

    const transacoesCriadas = [];
    const gastosAtualizados = [];

    // 2. Verificar quais já foram processados hoje
    for (const gasto of gastosRecorrentes) {
      const descricaoPadrao = `${gasto.nome} (Recorrente)`;

      // Verifica na tabela 'transacoes' se já existe um lançamento hoje com esse nome
      const { data: transacaoExistente } = await supabase
        .from('transacoes')
        .select('id')
        .eq('descricao', descricaoPadrao) // Usando 'descricao' como chave de verificação
        .gte('data', `${dataHojeISO}T00:00:00`)
        .lte('data', `${dataHojeISO}T23:59:59`)
        .limit(1);

      if (transacaoExistente && transacaoExistente.length > 0) {
        console.log(`⏭️ Gasto "${gasto.nome}" já processado hoje.`);
        continue; // Pula para o próximo
      }

      // 3. Criar Transação na tabela principal
      const { data: transacao, error: errorTransacao } = await supabase
        .from('transacoes')
        .insert({
          tipo: 'despesa',
          valor: gasto.valor,
          categoria: 'Assinaturas', // Categoria padrão
          descricao: descricaoPadrao,
          metodo_pagamento: 'Cartão de Crédito', // Padrão assumido para recorrentes
          data: new Date().toISOString(),
          // Se tiver usuário vinculado no gasto_mensal, use aqui, senão pode dar erro de RLS se for rodado por cron job anonimo
          usuario_id: gasto.usuario_id 
        })
        .select();

      if (errorTransacao) {
        console.error(`❌ Erro ao criar transação para ${gasto.nome}:`, errorTransacao);
        continue;
      }

      transacoesCriadas.push(transacao?.[0]);
      gastosAtualizados.push(gasto.nome);
      console.log(`✅ Gasto "${gasto.nome}" processado: R$ ${gasto.valor}`);
    }

    return NextResponse.json({
      success: true,
      message: `Processados ${transacoesCriadas.length} gastos recorrentes`,
      processados_qtd: transacoesCriadas.length,
      gastos: gastosAtualizados,
      transacoes: transacoesCriadas,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Erro ao processar gastos recorrentes',
      details: error.message
    }, { status: 500 });
  }
}