export default function DashboardPage({ searchParams }: { searchParams: { periodo?: string } }) {
  const periodo = searchParams.periodo || 'geral';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Meu Painel Financeiro
      </h1>
      <p className="text-gray-500 mb-8">
        Visualizando os dados do período: <span className="font-semibold text-blue-600 capitalize">{periodo}</span>
      </p>

      {/* Grid de Cards (Futuramente vamos ligar ao Supabase) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Receitas</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">R$ 0,00</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Despesas</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">R$ 0,00</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Saldo Atual</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">R$ 0,00</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500">
          Em breve: Aqui entrarão os seus gráficos bonitos e a lista detalhada para exportar em PDF! 📊
        </p>
      </div>
    </div>
  );
}