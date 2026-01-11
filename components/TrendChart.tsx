'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { supabase } from '@/lib/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type Vista = 'diaria' | 'semanal' | 'mensual' | 'personalizada'

interface TrendChartProps {
  vista?: Vista
  fechaInicio?: string
  fechaFin?: string
}

export function TrendChart({ vista = 'mensual', fechaInicio, fechaFin }: TrendChartProps = {}) {
  const [chartData, setChartData] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchTrendData()
  }, [vista, fechaInicio, fechaFin])

  const fetchTrendData = async () => {
    let startDate: Date
    const endDate = new Date()

    // Ajuste de datas (igual ao page.tsx)
    switch (vista) {
      case 'diaria':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'semanal':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 28)
        break
      case 'mensual':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 12)
        break
      case 'personalizada':
        if (!fechaInicio || !fechaFin) return
        startDate = new Date(fechaInicio)
        endDate.setTime(new Date(fechaFin).getTime())
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
    }

    // --- AQUI ESTÁ A MUDANÇA PRINCIPAL ---
    // Agora busca na tabela 'transacoes' usando 'data'
    const { data } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', startDate.toISOString())
      .lte('data', endDate.toISOString())
      .order('data', { ascending: true })

    if (data && data.length > 0) {
      const groupedByDate: Record<string, { receitas: number; despesas: number }> = {}

      data.forEach(row => {
        // Coluna 'data' em vez de 'fecha'
        const dataFormatada = new Date(row.data).toISOString().split('T')[0]
        
        if (!groupedByDate[dataFormatada]) {
          groupedByDate[dataFormatada] = { receitas: 0, despesas: 0 }
        }

        // Coluna 'valor' em vez de 'monto'
        const valor = parseFloat(row.valor || 0)
        
        // Tipos 'receita'/'despesa' em vez de 'ingreso'/'gasto'
        if (row.tipo === 'receita') {
          groupedByDate[dataFormatada].receitas += valor
        } else if (row.tipo === 'despesa') {
          groupedByDate[dataFormatada].despesas += valor
        }
      })

      const sortedDates = Object.keys(groupedByDate).sort()
      const labels = sortedDates.map(d =>
        new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      )
      const receitas = sortedDates.map(d => groupedByDate[d].receitas)
      const despesas = sortedDates.map(d => groupedByDate[d].despesas)

      setChartData({
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: receitas,
            borderColor: 'rgb(34, 197, 94)', // Green
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.3,
          },
          {
            label: 'Despesas',
            data: despesas,
            borderColor: 'rgb(239, 68, 68)', // Red
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
          },
        ],
      })
    } else {
      setChartData({
        labels: [],
        datasets: []
      })
    }
  }

  if (!chartData) return <div className="text-center py-10 text-gray-500">Carregando gráfico...</div>
  if (chartData.labels.length === 0) return <div className="text-center py-10 text-gray-500">Sem dados para este período</div>

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumSignificantDigits: 3 }),
              font: { size: 10 }
            },
          },
          x: {
            ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 },
          },
        },
      }}
    />
  )
}