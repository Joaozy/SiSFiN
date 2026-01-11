import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx'; // Certifique-se de ter instalado: npm install xlsx

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });

    const transacoesParaInserir = jsonData.map((row: any) => ({
      usuario_id: user.id,
      // Mapeamento de colunas do Excel (assumindo que o usuário use nomes em PT)
      data: row['Data'] || row['data'] || new Date().toISOString(),
      descricao: row['Descrição'] || row['descricao'] || 'Importado do Excel',
      categoria: row['Categoria'] || row['categoria'] || 'Outros',
      valor: row['Valor'] || row['valor'] || 0,
      tipo: (row['Valor'] || 0) < 0 ? 'despesa' : 'receita', // Inferência simples
      metodo_pagamento: 'Outros'
    }));

    const { error } = await supabase
      .from('transacoes')
      .insert(transacoesParaInserir);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      count: transacoesParaInserir.length,
      message: `${transacoesParaInserir.length} transações importadas com sucesso!`
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}