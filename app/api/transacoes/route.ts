import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const vista = searchParams.get('vista') || 'mensual';

    // Definir data de início baseada na vista
    let dataInicio = new Date();
    const dataFim = new Date(); // Hoje

    // Ajuste para pegar o dia/mês completo
    dataFim.setHours(23, 59, 59, 999);

    if (vista === 'diaria') {
        dataInicio.setHours(0, 0, 0, 0); // Começo de hoje
    } else if (vista === 'semanal') {
        dataInicio.setDate(dataInicio.getDate() - 7);
    } else if (vista === 'mensual') {
        dataInicio.setDate(dataInicio.getDate() - 30);
    } else if (vista === 'personalizada') {
        // Se precisar de lógica personalizada, pode adicionar aqui
        dataInicio.setDate(dataInicio.getDate() - 365); // Default seguro
    }

    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', dataInicio.toISOString())
      .lte('data', dataFim.toISOString())
      .order('data', { ascending: false });

    if (error) {
        console.error('Erro Supabase:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // Pega o usuário para garantir a autoria
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('transacoes')
      .insert({
        ...body,
        usuario_id: user.id
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}