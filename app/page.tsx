'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, DollarSign, Loader2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Interfaces
interface Transacao {
  id: string
  tipo: 'receita' | 'despesa'
  valor: number
  categoria: string
  data: string
  descricao: string
}

interface DashboardData {
  receitas: number
  despesas: number
  saldo: number
  historico: any[]
  ultimasTransacoes: Transacao[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ receitas: 0, despesas: 0, saldo: 0, historico: [], ultimasTransacoes: [] })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkUserAndFetch() {
      // 1. Verificar Autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // 2. Buscar Transações Reais
      try {
        const res = await fetch('/api/transacoes?vista=mensual')
        if (!res.ok) throw new Error('Falha ao buscar dados')
        
        const transacoes: Transacao[] = await res.json()
        processarDados(transacoes)
      } catch (error) {
        console.error("Erro dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    checkUserAndFetch()
  }, [router])

  const processarDados = (transacoes: Transacao[]) => {
    let receitas = 0
    let despesas = 0
    const historicoMap = new Map()

    // Ordenar por data (mais recente primeiro)
    const sorted = transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    sorted.forEach(t => {
      const valor = Number(t.valor)
      if (t.tipo === 'receita') receitas += valor
      if (t.tipo === 'despesa') despesas += valor

      // Agrupar para gráfico (por dia)
      const dataFormatada = new Date(t.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (!historicoMap.has(dataFormatada)) {
        historicoMap.set(dataFormatada, { name: dataFormatada, entrada: 0, saida: 0 })
      }
      const dia = historicoMap.get(dataFormatada)
      if (t.tipo === 'receita') dia.entrada += valor
      else dia.saida += valor
    })

    // Converter mapa para array e inverter para o gráfico (cronológico)
    const historico = Array.from(historicoMap.values()).reverse()

    setData({
      receitas,
      despesas,
      saldo: receitas - despesas,
      historico,
      ultimasTransacoes: sorted.slice(0, 5) // Pegar as 5 últimas
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-gray-100 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Visão Geral
            </h1>
            <p className="text-gray-400">Bem-vindo, {user?.email}</p>
          </div>
          <button 
             onClick={() => router.push('/agente-avancado')}
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20"
          >
            <DollarSign size={18} />
            Nova Transação (IA)
          </button>
        </div>

        {/* Cards de KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
            title="Receitas" 
            value={data.receitas} 
            icon={<TrendingUp className="text-emerald-400" />} 
            color="emerald" 
          />
          <KPICard 
            title="Despesas" 
            value={data.despesas} 
            icon={<TrendingDown className="text-red-400" />} 
            color="red" 
          />
          <KPICard 
            title="Saldo Atual" 
            value={data.saldo} 
            icon={<DollarSign className="text-blue-400" />} 
            color="blue" 
          />
        </div>

        {/* Gráfico e Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Gráfico */}
          <div className="lg:col-span-2 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-xl shadow-xl">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Fluxo de Caixa (Últimos 30 dias)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.historico}>
                  <defs>
                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntrada)" name="Receitas" />
                  <Area type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSaida)" name="Despesas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Últimas Transações */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-xl shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-white">Últimos Registros</h3>
            <div className="space-y-4">
              {data.ultimasTransacoes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma transação ainda.</p>
              ) : (
                data.ultimasTransacoes.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${t.tipo === 'receita' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.tipo === 'receita' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{t.descricao}</p>
                        <p className="text-xs text-gray-500">{t.categoria} • {new Date(t.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${t.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.tipo === 'receita' ? '+' : '-'} {Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button 
                onClick={() => router.push('/report')}
                className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors border-t border-gray-700 pt-4"
            >
                Ver histórico completo
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// Componente simples de Card para não depender de arquivos externos quebrados
function KPICard({ title, value, icon, color }: any) {
    const formattedValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    return (
        <div className={`bg-gray-800/50 p-6 rounded-2xl border border-gray-700 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-${color}-500/30 transition-all`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">{formattedValue}</h3>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-${color}-500/50`} />
        </div>
    )
}