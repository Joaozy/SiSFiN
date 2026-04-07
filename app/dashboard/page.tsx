'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Tag, Calendar, Loader2, Filter, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 ESTADOS DOS FILTROS AVANÇADOS
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('todas');

  useEffect(() => {
    async function carregarDados() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data', { ascending: false });

      if (data) setTransacoes(data);
      setLoading(false);
    }
    carregarDados();
  }, [router]);

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;

  // 🧹 APLICAÇÃO DOS FILTROS
  const transacoesFiltradas = transacoes.filter(t => {
    const dataT = t.data.split('T')[0];
    const passaDataInicio = dataInicio ? dataT >= dataInicio : true;
    const passaDataFim = dataFim ? dataT <= dataFim : true;
    const passaTipo = filtroTipo === 'todos' || t.tipo === filtroTipo;
    const passaCategoria = filtroCategoria === 'todas' || t.categoria === filtroCategoria;
    const passaSubcategoria = filtroSubcategoria === 'todas' || t.subcategoria === filtroSubcategoria;

    return passaDataInicio && passaDataFim && passaTipo && passaCategoria && passaSubcategoria;
  });

  // 🗂️ LISTAS DINÂMICAS PARA OS MENUS
  const categoriasDisponiveis = Array.from(new Set(transacoes.map(t => t.categoria)));
  const subcategoriasDisponiveis = filtroCategoria === 'todas' 
    ? [] 
    : Array.from(new Set(transacoes.filter(t => t.categoria === filtroCategoria && t.subcategoria).map(t => t.subcategoria)));

  // 📊 CÁLCULOS E ANALYTICS
  let totalReceitas = 0, totalDespesas = 0;
  const gastosPorSub: Record<string, number> = {};
  
  let maiorDespesa = { valor: 0, descricao: '-', data: '' };
  let menorDespesa = { valor: 9999999, descricao: '-', data: '' };
  const contagemPorCategoria: Record<string, number> = {};

  transacoesFiltradas.forEach((t) => {
    if (t.tipo === 'receita') {
      totalReceitas += Number(t.valor);
    } else {
      const valorNum = Number(t.valor);
      totalDespesas += valorNum;
      
      const chaveSub = `${t.categoria} > ${t.subcategoria || 'Geral'}`;
      gastosPorSub[chaveSub] = (gastosPorSub[chaveSub] || 0) + valorNum;
      
      contagemPorCategoria[t.categoria] = (contagemPorCategoria[t.categoria] || 0) + 1;

      if (valorNum > maiorDespesa.valor) maiorDespesa = { valor: valorNum, descricao: t.descricao, data: t.data };
      if (valorNum < menorDespesa.valor) menorDespesa = { valor: valorNum, descricao: t.descricao, data: t.data };
    }
  });

  if (menorDespesa.valor === 9999999) menorDespesa.valor = 0;

  const saldoAtual = totalReceitas - totalDespesas;
  const subsOrdenadas = Object.entries(gastosPorSub).sort((a, b) => b[1] - a[1]);
  const categoriaMaisUsada = Object.entries(contagemPorCategoria).sort((a, b) => b[1] - a[1])[0];
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      <div className="flex flex-col gap-6">
        {/* Título com Gradiente Premium */}
        <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Seu Painel de Controle
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe a sua saúde financeira em tempo real.</p>
        </div>
        
        {/* 🎛️ BARRA DE FILTROS AVANÇADOS (Estilo Glassmorphism Suave) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white/60 dark:bg-gray-900/50 backdrop-blur-xl p-5 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-white dark:border-gray-800">
          
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1.5 ml-1 font-semibold uppercase tracking-wider">Data Inicial</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all" />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1.5 ml-1 font-semibold uppercase tracking-wider">Data Final</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all" />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1.5 ml-1 font-semibold uppercase tracking-wider">Tipo</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all cursor-pointer">
              <option value="todos">Todas as Movimentações</option>
              <option value="receita">Apenas Receitas</option>
              <option value="despesa">Apenas Despesas</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1.5 ml-1 font-semibold uppercase tracking-wider">Categoria</label>
            <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setFiltroSubcategoria('todas'); }} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all cursor-pointer">
              <option value="todas">Todas</option>
              {categoriasDisponiveis.map(c => <option key={c} value={c as string}>{c as string}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1.5 ml-1 font-semibold uppercase tracking-wider">Subcategoria</label>
            <select value={filtroSubcategoria} onChange={e => setFiltroSubcategoria(e.target.value)} disabled={filtroCategoria === 'todas'} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 shadow-sm transition-all cursor-pointer">
              <option value="todas">{filtroCategoria === 'todas' ? 'Escolha Categoria...' : 'Todas as Subs'}</option>
              {subcategoriasDisponiveis.map(s => <option key={s} value={s as string}>{s as string}</option>)}
            </select>
          </div>
          
        </div>
      </div>

      {/* Cards KPI Principais - Estilo Fintech */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Receitas */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 rounded-2xl"><ArrowUpCircle size={32} /></div>
          <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Receitas</p><p className="text-3xl font-black text-gray-800 dark:text-white mt-1">{formatarMoeda(totalReceitas)}</p></div>
        </div>

        {/* Despesas */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="p-4 bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-500/30 rounded-2xl"><ArrowDownCircle size={32} /></div>
          <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Despesas</p><p className="text-3xl font-black text-gray-800 dark:text-white mt-1">{formatarMoeda(totalDespesas)}</p></div>
        </div>

        {/* Saldo */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1">
          <div className={`p-4 rounded-2xl text-white shadow-lg ${saldoAtual >= 0 ? 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-indigo-500/30' : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-rose-500/30'}`}><Wallet size={32} /></div>
          <div><p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Saldo Geral</p><p className={`text-3xl font-black mt-1 ${saldoAtual >= 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400' : 'text-rose-600'}`}>{formatarMoeda(saldoAtual)}</p></div>
        </div>
      </div>

      {/* 📈 NOVA SECÇÃO DE ANALYTICS - Estilo Premium Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 border border-indigo-800/50 shadow-xl">
        {/* Elemento de background brilhante */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
        
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white relative z-10"><BarChart3 className="text-indigo-400"/> Inteligência & Análises <span className="text-indigo-300 text-sm font-normal ml-2">(No período filtrado)</span></h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
           <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
              <p className="text-xs text-indigo-200 flex items-center gap-1 uppercase tracking-wider font-semibold"><TrendingUp size={14} className="text-rose-400"/> Maior Despesa Única</p>
              <p className="text-2xl font-bold mt-2 text-white">{formatarMoeda(maiorDespesa.valor)}</p>
              <p className="text-sm text-indigo-200 mt-1 truncate">{maiorDespesa.descricao}</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
              <p className="text-xs text-indigo-200 flex items-center gap-1 uppercase tracking-wider font-semibold"><TrendingDown size={14} className="text-emerald-400"/> Menor Despesa Única</p>
              <p className="text-2xl font-bold mt-2 text-white">{formatarMoeda(menorDespesa.valor)}</p>
              <p className="text-sm text-indigo-200 mt-1 truncate">{menorDespesa.descricao}</p>
           </div>
           <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
              <p className="text-xs text-indigo-200 flex items-center gap-1 uppercase tracking-wider font-semibold"><Tag size={14} className="text-blue-400"/> Categoria Frequente</p>
              <p className="text-2xl font-bold mt-2 text-white truncate">{categoriaMaisUsada ? categoriaMaisUsada[0] : '-'}</p>
              <p className="text-sm text-indigo-200 mt-1 bg-white/10 inline-block px-2 py-0.5 rounded-full">{categoriaMaisUsada ? `${categoriaMaisUsada[1]} transações` : 'Nenhuma'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gastos por Subcategoria */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100"><Tag className="text-emerald-500"/> Onde você mais gastou</h2>
          <div className="space-y-6">
            {subsOrdenadas.length === 0 && <p className="text-sm text-gray-500 text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">Sem despesas no período.</p>}
            {subsOrdenadas.map(([cat, val], i) => (
              <div key={i} className="group">
                <div className="flex justify-between text-sm mb-2"><span className="font-bold text-gray-700 dark:text-gray-300 truncate pr-2">{cat}</span><span className="text-gray-900 dark:text-white font-semibold">{formatarMoeda(val)}</span></div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner"><div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${(val / totalDespesas) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista Filtrada */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100"><Calendar className="text-blue-500"/> Histórico de Movimentações <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm px-2.5 py-0.5 rounded-full ml-2">{transacoesFiltradas.length}</span></h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {transacoesFiltradas.length === 0 && (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500">Nenhuma transação encontrada com estes filtros.</p>
                </div>
            )}
            {transacoesFiltradas.map((t) => (
              <div key={t.id_curto || t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 transform hover:-translate-y-0.5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm ${t.tipo === 'receita' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white'}`}>
                    {t.tipo === 'receita' ? '+' : <Tag size={20}/>}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-extrabold text-gray-900 dark:text-white truncate text-base">{t.descricao}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 tracking-wider font-semibold truncate">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md uppercase mr-2">{t.categoria}</span> 
                      {t.subcategoria || 'Geral'} • {new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                </div>
                <div className={`font-black text-lg flex-shrink-0 ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                  {t.tipo === 'receita' ? '+' : '-'}{formatarMoeda(t.valor)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}