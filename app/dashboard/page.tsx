import { createClient } from '@supabase/supabase-js';

// Conectando ao banco de dados com a chave de administrador
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function DashboardPage(props: { searchParams: Promise<{ periodo?: string }> }) {
  const searchParams = await props.searchParams;
  const periodo = searchParams.periodo || 'geral';

  // 1. Busca TODAS as transações no banco de dados
  const { data: transacoes, error } = await supabase
    .from('transacoes')
    .select('*')
    .order('data', { ascending: false }); // Já traz da mais recente para a mais antiga

  // 2. Prepara a matemática
  let totalReceitas = 0;
  let totalDespesas = 0;

  if (transacoes && !error) {
    transacoes.forEach((t) => {
      if (t.tipo === 'receita') totalReceitas += Number(t.valor);
      if (t.tipo === 'despesa') totalDespesas += Number(t.valor);
    });
  }

  const saldoAtual = totalReceitas - totalDespesas;

  // Função simples para formatar os números para Reais (R$)
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Meu Painel Financeiro
      </h1>
      <p className="text-gray-500 mb-8">
        Visualizando os dados do período: <span className="font-semibold text-blue-600 capitalize">{periodo}</span>
      </p>

      {/* Grid de Cards com os dados REAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Receitas</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">{formatarMoeda(totalReceitas)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Despesas</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatarMoeda(totalDespesas)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Saldo Atual</h3>
          <p className={`text-2xl font-bold mt-2 ${saldoAtual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatarMoeda(saldoAtual)}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Últimas Transações</h3>
        
        {/* Mostra uma lista com os últimos gastos/receitas */}
        {transacoes && transacoes.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {transacoes.map((t) => (
              <li key={t.id_curto || t.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{t.descricao}</p>
                  <p className="text-sm text-gray-500">{t.categoria} • <span className="text-xs">ID: {t.id_curto}</span></p>
                </div>
                <div className={`font-semibold ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.tipo === 'receita' ? '+' : '-'} {formatarMoeda(t.valor)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Nenhuma transação encontrada ainda. Mande uma mensagem no WhatsApp!</p>
        )}
      </div>
    </div>
  );
}