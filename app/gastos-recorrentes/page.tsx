'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Check, X, RefreshCw, Zap } from 'lucide-react'

interface GastoRecorrente {
  id: string
  nome: string
  dia_cobranca: number
  valor: number
  activo: boolean
}

export default function GastosRecorrentesPage() {
  const [gastos, setGastos] = useState<GastoRecorrente[]>([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  
  // Estado para novo gasto
  const [novoGasto, setNovoGasto] = useState({
    nome: '',
    dia_cobranca: 1,
    valor: ''
  })

  useEffect(() => {
    fetchGastos()
  }, [])

  const fetchGastos = async () => {
    try {
      const res = await fetch('/api/gastos-recorrentes')
      const json = await res.json()
      if (json.data) setGastos(json.data)
    } catch (error) {
      console.error('Erro ao buscar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoGasto.nome || !novoGasto.valor) return

    try {
      const res = await fetch('/api/gastos-recorrentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoGasto,
          valor: parseFloat(novoGasto.valor),
          ativo: true
        })
      })

      if (res.ok) {
        setNovoGasto({ nome: '', dia_cobranca: 1, valor: '' })
        fetchGastos()
      }
    } catch (error) {
      console.error('Erro ao criar:', error)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta assinatura?')) return
    try {
      await fetch(`/api/gastos-recorrentes?id=${id}`, { method: 'DELETE' })
      setGastos(prev => prev.filter(g => g.id !== id))
    } catch (error) {
      console.error('Erro ao excluir:', error)
    }
  }

  const handleProcessarHoje = async () => {
    setProcessando(true)
    try {
      const res = await fetch('/api/gastos-recorrentes/processar', { method: 'POST' })
      const data = await res.json()
      alert(data.message)
    } catch (error) {
      alert('Erro ao processar')
    } finally {
      setProcessando(false)
    }
  }

  const totalMensal = gastos.filter(g => g.activo).reduce((acc, g) => acc + Number(g.valor), 0)

  return (
    <main className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
            <RefreshCw className="w-8 h-8 text-purple-600" />
            Assinaturas & Recorrentes
          </h1>
          <p className="text-gray-500">Gerencie contas fixas (Netflix, Aluguel, Academia)</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-3 rounded-2xl border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">Custo Mensal Fixo</p>
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">R$ {totalMensal.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Adição */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Nova Assinatura</h2>
            <form onSubmit={handleAdicionar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome (Ex: Netflix)</label>
                <input 
                  type="text" 
                  value={novoGasto.nome}
                  onChange={e => setNovoGasto({...novoGasto, nome: e.target.value})}
                  className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={novoGasto.valor}
                    onChange={e => setNovoGasto({...novoGasto, valor: e.target.value})}
                    className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dia Cobrança</label>
                  <input 
                    type="number" 
                    min="1" max="31"
                    value={novoGasto.dia_cobranca}
                    onChange={e => setNovoGasto({...novoGasto, dia_cobranca: parseInt(e.target.value)})}
                    className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
                <Plus size={20} /> Adicionar
              </button>
            </form>

            <hr className="my-6 border-gray-200 dark:border-gray-700" />

            <button 
              onClick={handleProcessarHoje}
              disabled={processando}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 text-sm"
            >
              {processando ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
              Verificar Cobranças de Hoje
            </button>
          </div>
        </div>

        {/* Lista de Assinaturas */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <p>Carregando...</p>
          ) : gastos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <p className="text-gray-500">Nenhuma assinatura cadastrada</p>
            </div>
          ) : (
            gastos.map(gasto => (
              <div key={gasto.id} className="group bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
                    {gasto.dia_cobranca}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{gasto.nome}</h3>
                    <p className="text-sm text-gray-500">Todo dia {gasto.dia_cobranca}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-200">
                    R$ {Number(gasto.valor).toFixed(2)}
                  </span>
                  <button 
                    onClick={() => handleExcluir(gasto.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}