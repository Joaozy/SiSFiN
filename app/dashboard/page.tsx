'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Tag, Calendar, Loader2, Filter } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

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

  // APLICAÇÃO DOS FILTROS
  const transacoesFiltradas = transacoes.filter(t => {
    const dataT = new Date(t.data);
    const mesT = `${dataT.getFullYear()}-${String(dataT.getMonth() + 1).padStart(2, '0')}`;
    
    const passaMes = filtroMes === 'todos' || mesT === filtroMes;
    const passaTipo = filtroTipo === 'todos' || t.tipo === filtroTipo;
    const passaCategoria = filtroCategoria === 'todas' || t.categoria === filtroCategoria;

    return passaMes && passaTipo && passaCategoria;
  });

  // Lista única de categorias para o seletor (baseada apenas nos dados filtrados do usuário)
  const categoriasDisponiveis = Array.from(new Set(transacoes.map(t => t.categoria)));

  // Cálculos
  let totalReceitas = 0, totalDespesas = 0;
  
  // 🧹 A CORREÇÃO ESTÁ AQUI: Avisamos o TypeScript o que vai entrar neste objeto
  const gastosPorSub: Record<string, number> = {};

  transacoesFiltradas.forEach((t) => {
    if (t.tipo === 'receita') {
      totalReceitas += Number(t.valor);
    } else {
      totalDespesas += Number(t.valor);
      const chave = `${t.categoria} > ${t.subcategoria || 'Geral'}`;
      gastosPorSub[chave] = (gastosPorSub[chave] || 0) + Number(t.valor);
    }
  });

  const saldoAtual = totalReceitas - totalDespesas;
  const subsOrdenadas = Object.entries(gastosPorSub).sort((a, b) => b[1] - a[1]);
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Seu Painel</h1>
        
        {/* BARRA DE FILTROS */}
        <div className="flex flex-wrap gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center pl-3 text-gray-400"><Filter size={18}/></div>
          <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none text-gray-700 dark:text-gray-300">
            <option value="todos">Todo o período</option>
            <option value="2026-04">Abril 2026</option>
            <option value="2026-03">Março 2026</option>
            <option value="2026-02">Fevereiro 2026</option>
          </select>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none text-gray-700 dark:text-gray-300">
            <option value="todos">Todas Movimentações</option>
            <option value="receita">Só Receitas</option>
            <option value="despesa">Só Despesas</option>
          </select>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none text-gray-700 dark:text-gray-300">
            <option value="todas">Todas Categorias</option>
            {categoriasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Cards KPI */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gastos por Subcategoria */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Tag className="text-emerald-500"/> Por Subcategoria</h2>
          <div className="space-y-5">
            {subsOrdenadas.map(([cat, val], i) => (
              <div key={i} className="group">
                <div className="flex justify-between text-sm mb-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{cat}</span><span className="text-gray-500">{formatarMoeda(val)}</span></div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"><div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(val / totalDespesas) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista Filtrada */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-emerald-500"/> Transações Encontradas ({transacoesFiltradas.length})</h2>
          <div className="space-y-3">
            {transacoesFiltradas.map((t) => (
              <div key={t.id_curto || t.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${t.tipo === 'receita' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-600 shadow-sm'}`}>
                    {t.tipo === 'receita' ? '+' : <Tag size={20}/>}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{t.descricao}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide font-medium">
                      {t.categoria} • {t.subcategoria || 'Geral'} • {new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </p>
                  </div>
                </div>
                <div className={`font-extrabold text-lg ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
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