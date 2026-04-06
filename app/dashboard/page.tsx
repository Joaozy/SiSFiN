'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Tag, Calendar, Loader2, Filter, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 NOVOS ESTADOS DOS FILTROS AVANÇADOS
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

  // 🧹 APLICAÇÃO DOS FILTROS (Datas, Categorias e Subcategorias)
  const transacoesFiltradas = transacoes.filter(t => {
    const dataT = t.data.split('T')[0]; // Pega apenas a parte YYYY-MM-DD
    
    const passaDataInicio = dataInicio ? dataT >= dataInicio : true;
    const passaDataFim = dataFim ? dataT <= dataFim : true;
    const passaTipo = filtroTipo === 'todos' || t.tipo === filtroTipo;
    const passaCategoria = filtroCategoria === 'todas' || t.categoria === filtroCategoria;
    const passaSubcategoria = filtroSubcategoria === 'todas' || t.subcategoria === filtroSubcategoria;

    return passaDataInicio && passaDataFim && passaTipo && passaCategoria && passaSubcategoria;
  });

  // 🗂️ LISTAS DINÂMICAS PARA OS MENUS
  const categoriasDisponiveis = Array.from(new Set(transacoes.map(t => t.categoria)));
  // Só mostra as subcategorias da categoria selecionada
  const subcategoriasDisponiveis = filtroCategoria === 'todas' 
    ? [] 
    : Array.from(new Set(transacoes.filter(t => t.categoria === filtroCategoria && t.subcategoria).map(t => t.subcategoria)));

  // 📊 CÁLCULOS E ANALYTICS
  let totalReceitas = 0, totalDespesas = 0;
  const gastosPorSub: Record<string, number> = {};
  
  // Variáveis para as Análises (Analytics)
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

      // Descobre Maior e Menor transação de despesa
      if (valorNum > maiorDespesa.valor) maiorDespesa = { valor: valorNum, descricao: t.descricao, data: t.data };
      if (valorNum < menorDespesa.valor) menorDespesa = { valor: valorNum, descricao: t.descricao, data: t.data };
    }
  });

  if (menorDespesa.valor === 9999999) menorDespesa.valor = 0; // Prevenção se não houver despesas

  const saldoAtual = totalReceitas - totalDespesas;
  const subsOrdenadas = Object.entries(gastosPorSub).sort((a, b) => b[1] - a[1]);
  const categoriaMaisUsada = Object.entries(contagemPorCategoria).sort((a, b) => b[1] - a[1])[0];
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Seu Painel de Controle</h1>
        
        {/* 🎛️ NOVA BARRA DE FILTROS AVANÇADOS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1 font-semibold">Data Inicial</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1 font-semibold">Data Final</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1 font-semibold">Tipo</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="todos">Todas</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1 font-semibold">Categoria</label>
            <select value={filtroCategoria} onChange={e => { setFiltroCategoria(e.target.value); setFiltroSubcategoria('todas'); }} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="todas">Todas</option>
              {categoriasDisponiveis.map(c => <option key={c} value={c as string}>{c as string}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1 ml-1 font-semibold">Subcategoria</label>
            <select value={filtroSubcategoria} onChange={e => setFiltroSubcategoria(e.target.value)} disabled={filtroCategoria === 'todas'} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">
              <option value="todas">{filtroCategoria === 'todas' ? 'Escolha a Categoria primeiro' : 'Todas as Subs'}</option>
              {subcategoriasDisponiveis.map(s => <option key={s} value={s as string}>{s as string}</option>)}
            </select>
          </div>
          
        </div>
      </div>

      {/* Cards KPI Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><ArrowUpCircle size={32} /></div>
          <div><p className="text-sm font-medium text-gray-500 uppercase">Receitas</p><p className="text-3xl font-bold">{formatarMoeda(totalReceitas)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl"><ArrowDownCircle size={32} /></div>
          <div><p className="text-sm font-medium text-gray-500 uppercase">Despesas</p><p className="text-3xl font-bold">{formatarMoeda(totalDespesas)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5">
          <div className={`p-4 rounded-2xl ${saldoAtual >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}><Wallet size={32} /></div>
          <div><p className="text-sm font-medium text-gray-500 uppercase">Saldo</p><p className={`text-3xl font-bold ${saldoAtual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatarMoeda(saldoAtual)}</p></div>
        </div>
      </div>

      {/* 📈 NOVA SECÇÃO DE ANALYTICS */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-800/30">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-900 dark:text-indigo-200"><BarChart3 className="text-indigo-500"/> Inteligência & Análises (No período filtrado)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
              <p className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp size={14} className="text-rose-500"/> Maior Despesa Única</p>
              <p className="text-xl font-bold mt-1">{formatarMoeda(maiorDespesa.valor)}</p>
              <p className="text-sm text-gray-500 truncate">{maiorDespesa.descricao}</p>
           </div>
           <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
              <p className="text-xs text-gray-500 flex items-center gap-1"><TrendingDown size={14} className="text-emerald-500"/> Menor Despesa Única</p>
              <p className="text-xl font-bold mt-1">{formatarMoeda(menorDespesa.valor)}</p>
              <p className="text-sm text-gray-500 truncate">{menorDespesa.descricao}</p>
           </div>
           <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
              <p className="text-xs text-gray-500 flex items-center gap-1"><Tag size={14} className="text-blue-500"/> Categoria com Mais Registros</p>
              <p className="text-xl font-bold mt-1">{categoriaMaisUsada ? categoriaMaisUsada[0] : '-'}</p>
              <p className="text-sm text-gray-500">{categoriaMaisUsada ? `${categoriaMaisUsada[1]} transações` : 'Nenhuma'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gastos por Subcategoria */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Tag className="text-emerald-500"/> Onde você mais gastou</h2>
          <div className="space-y-5">
            {subsOrdenadas.length === 0 && <p className="text-sm text-gray-500">Sem despesas no período.</p>}
            {subsOrdenadas.map(([cat, val], i) => (
              <div key={i} className="group">
                <div className="flex justify-between text-sm mb-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300 truncate pr-2">{cat}</span><span className="text-gray-500">{formatarMoeda(val)}</span></div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"><div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(val / totalDespesas) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista Filtrada */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-emerald-500"/> Lista de Transações ({transacoesFiltradas.length})</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {transacoesFiltradas.map((t) => (
              <div key={t.id_curto || t.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${t.tipo === 'receita' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-600 shadow-sm'}`}>
                    {t.tipo === 'receita' ? '+' : <Tag size={20}/>}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{t.descricao}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium truncate">
                      {t.categoria} • {t.subcategoria || 'Geral'} • {new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                </div>
                <div className={`font-extrabold text-lg flex-shrink-0 ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
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