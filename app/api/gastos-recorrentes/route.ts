import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Obter todos os gastos recorrentes
export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('gastos_mensais') // Tabela nova
    .select('*')
    .order('dia_cobranca', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST: Criar novo gasto recurrente
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('gastos_mensais')
    .insert({
      nome: body.nome,
      dia_cobranca: body.dia_cobranca,
      valor: body.valor,
      activo: body.ativo ?? true,
      usuario_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// PUT: Atualizar gasto recurrente
export async function PUT(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('gastos_mensais')
    .update({
      nome: body.nome,
      dia_cobranca: body.dia_cobranca,
      valor: body.valor,
      activo: body.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE: Remover gasto recurrente
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const { error } = await supabase
    .from('gastos_mensais')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}