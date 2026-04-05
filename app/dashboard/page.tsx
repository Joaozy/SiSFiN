'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Tag, Calendar, ChevronRight, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('geral');

  useEffect(() => {
    // Pega o parâmetro da URL (se veio do WhatsApp)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setPeriodo(urlParams.get('periodo') || 'geral');
    }

    async function carregarDadosUsuario() {
      // 1. Identifica QUEM é o usuário que está logado no navegador
      const { data: { user } } = await supabase.auth.getUser();

      // Se não estiver logado, manda para a página de Login
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Busca as transações APENAS deste usuário específico!
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', user.id) // 🔒 O FILTRO DE SEGURANÇA AQUI
        .order('data', { ascending: false });

      if (data && !error) {
        setTransacoes(data);
      }
      setLoading(false);
    }

    carregarDadosUsuario();
  }, [router]);

  // Se ainda estiver a carregar o banco de dados, mostra o ícone a rodar
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Prepara a matemática e o agrupamento de categorias
  let totalReceitas = 0;
  let totalDespesas = 0;
  const gastosPorCategoria: Record<string, number> = {};

  transacoes.forEach((t) => {
    if (t.tipo === 'receita') {
      totalReceitas += Number(t.valor);
    } else if (t.tipo === 'despesa') {
      const valor = Number(t.valor);
      totalDespesas += valor;
      
      const cat = t.categoria || 'Outros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + valor;
    }
  });

  const saldoAtual = totalReceitas - totalDespesas;
  const categoriasOrdenadas = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Visão Geral
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe suas finanças no período: <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{periodo}</span>
          </p>
        </div>
      </div>

      {/* Cards de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Receitas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5 hover:shadow-md transition-all">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <ArrowUpCircle size={32} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receitas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatarMoeda(totalReceitas)}</p>
          </div>
        </div>

        {/* Card Despesas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5 hover:shadow-md transition-all">
          <div className="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl">
            <ArrowDownCircle size={32} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Despesas</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatarMoeda(totalDespesas)}</p>
          </div>
        </div>

        {/* Card Saldo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5 hover:shadow-md transition-all">
          <div className={`p-4 rounded-2xl ${saldoAtual >= 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            <Wallet size={32} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saldo Atual</p>
            <p className={`text-3xl font-bold mt-1 ${saldoAtual >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatarMoeda(saldoAtual)}
            </p>
          </div>
        </div>
      </div>

      {/* Seção Principal Inferior (Gráfico + Lista) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Gastos por Categoria */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 dark:bg-gray-700 rounded-lg">
              <Tag className="text-emerald-500" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Por Categoria</h2>
          </div>
          
          {categoriasOrdenadas.length > 0 ? (
            <div className="space-y-6">
              {categoriasOrdenadas.map(([cat, val], index) => {
                const percentual = totalDespesas > 0 ? (val / totalDespesas) * 100 : 0;
                return (
                  <div key={index} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{cat}</span>
                      <span className="text-gray-500 font-medium">{formatarMoeda(val)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-emerald-500 hover:bg-emerald-400 h-3 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${percentual}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Nenhum gasto registrado neste período.</p>
          )}
        </div>

        {/* COLUNA DIREITA: Últimas Transações */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-gray-700 rounded-lg">
                <Calendar className="text-emerald-500" size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Últimas Movimentações</h2>
            </div>
          </div>

          {transacoes.length > 0 ? (
            <div className="space-y-3">
              {transacoes.slice(0, 10).map((t) => {
                const isReceita = t.tipo === 'receita';
                const dataFormatada = new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                
                return (
                  <div key={t.id_curto || t.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${isReceita ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-white text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {isReceita ? '+' : <Tag size={20}/>}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-[15px]">{t.descricao}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <span className="bg-gray-200/50 dark:bg-gray-700 px-2 py-0.5 rounded-md uppercase font-bold tracking-wide text-[10px]">
                            {t.categoria}
                          </span>
                          <span>• ID: {t.id_curto}</span>
                          <span>• {dataFormatada}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`font-extrabold text-lg ${isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                      {isReceita ? '+' : '-'}{formatarMoeda(t.valor)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Wallet className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-lg">Tudo limpo por aqui!</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">Nenhuma transação encontrada para a sua conta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}