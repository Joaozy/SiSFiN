'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { KPICard } from '@/components/KPICard'
import { DataViews } from '@/components/DataViews'
import { Calendar, TrendingUp, DollarSign } from 'lucide-react'

// Importação dinâmica do gráfico para evitar erros de renderização no servidor
const TrendChart = dynamic(() => import('@/components/TrendChart').then(mod => ({ default: mod.TrendChart })), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center text-gray-400">Carregando gráfico...</div>
})

type Vista = 'diaria' | 'semanal' | 'mensual' | 'personalizada'

export default function HomePage() {
  const [vista, setVista] = useState<Vista>('mensual')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // KPIs atualizados para Português
  const [kpis, setKpis] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    transacoes: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPIs()
  }, [vista, fechaInicio, fechaFin])

  const fetchKPIs = async () => {
    setLoading(true)
    let startDate: Date
    const endDate = new Date()

    // Lógica de Datas
    switch (vista) {
      case 'diaria':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break
      case 'semanal':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'mensual':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'personalizada':
        if (!fechaInicio || !fechaFin) {
          setLoading(false)
          return
        }
        startDate = new Date(fechaInicio)
        // Ajuste para pegar o final do dia na data fim
        const fim = new Date(fechaFin)
        fim.setHours(23, 59, 59, 999)
        endDate.setTime(fim.getTime())
        break
      default:
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
    }

    // Consulta na NOVA tabela 'transacoes'
    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', startDate.toISOString())
      .lte('data', endDate.toISOString())

    if (error) {
      console.error('Erro ao buscar KPIs:', error)
    }

    if (data) {
      let totalReceitas = 0
      let totalDespesas = 0

      data.forEach(row => {
        const valor = parseFloat(row.valor || 0)
        // Verifica o tipo novo ('receita' ou 'despesa')
        if (row.tipo === 'receita') totalReceitas += valor
        else if (row.tipo === 'despesa') totalDespesas += valor
      })

      setKpis({
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        transacoes: data.length,
      })
    }
    setLoading(false)
  }

  const aplicarFiltroPersonalizado = () => {
    if (fechaInicio && fechaFin) {
      setVista('personalizada')
      setShowDatePicker(false)
    }
  }

  const getLabelVista = () => {
    switch (vista) {
      case 'diaria': return 'Hoje'
      case 'semanal': return 'Últimos 7 dias'
      case 'mensual': return 'Últimos 30 dias'
      case 'personalizada': return `${new Date(fechaInicio).toLocaleDateString('pt-BR')} - ${new Date(fechaFin).toLocaleDateString('pt-BR')}`
      default: return 'Últimos 30 dias'
    }
  }

  if (loading && !kpis.transacoes) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        <div className="text-gray-600 dark:text-gray-400">Carregando Dashboard...</div>
      </div>
    </div>
  )

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
            Dashboard Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            Visão geral: <span className="text-emerald-600 dark:text-emerald-400">{getLabelVista()}</span>
          </p>
        </div>

        {/* Botões de Filtro */}
        <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <button onClick={() => setVista('diaria')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${vista === 'diaria' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            Hoje
          </button>
          <button onClick={() => setVista('semanal')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${vista === 'semanal' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            Semana
          </button>
          <button onClick={() => setVista('mensual')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${vista === 'mensual' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            Mês
          </button>
          <button onClick={() => setShowDatePicker(!showDatePicker)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${vista === 'personalizada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Calendar className="w-4 h-4" /> Personalizado
          </button>
        </div>
      </div>

      {/* Seletor de Data Personalizado */}
      {showDatePicker && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in-down">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Início</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fim</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700" />
            </div>
            <button onClick={aplicarFiltroPersonalizado} className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Cartões KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Receitas" value={kpis.receitas} icon="income" color="green" />
        <KPICard title="Despesas" value={kpis.despesas} icon="expense" color="red" />
        <KPICard title="Saldo Líquido" value={kpis.saldo} icon="balance" color={kpis.saldo >= 0 ? 'green' : 'red'} />
        <KPICard title="Transações" value={kpis.transacoes} icon="transactions" color="blue" />
      </div>

      {/* Gráfico de Tendência */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Tendência Financeira
        </h2>
        <div className="w-full h-[300px] sm:h-[400px]">
          <TrendChart vista={vista} fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-500" />
          Extrato Detalhado
        </h2>
        <DataViews vista={vista} fechaInicio={fechaInicio} fechaFin={fechaFin} hideControls={true} />
      </div>

    </main>
  )
}