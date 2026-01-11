'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calculator, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function CorteDiarioPage() {
  const [loading, setLoading] = useState(true)
  const [dataHj, setDataHj] = useState(new Date().toISOString().split('T')[0])
  
  // Totais do Sistema (o que foi registrado no app)
  const [sistema, setSistema] = useState({
    total_receitas: 0,
    total_despesas: 0,
    total_pix: 0,
    total_dinheiro: 0,
    total_cartao: 0,
    saldo_final: 0
  })

  // Totais Reais (o que você contou na gaveta)
  const [real, setReal] = useState({
    dinheiro: '',
    cartao: '',
    pix: ''
  })

  const [diferenca, setDiferenca] = useState(0)

  useEffect(() => {
    carregarDadosDoDia()
  }, [dataHj])

  useEffect(() => {
    calcularDiferenca()
  }, [real, sistema])

  const carregarDadosDoDia = async () => {
    setLoading(true)
    
    // Busca transações apenas do dia selecionado
    const inicioDia = `${dataHj}T00:00:00`
    const fimDia = `${dataHj}T23:59:59`

    const { data: transacoes } = await supabase
      .from('transacoes')
      .select('*')
      .gte('data', inicioDia)
      .lte('data', fimDia)

    if (transacoes) {
      const resumo = transacoes.reduce((acc, t) => {
        const valor = Number(t.valor)
        
        if (t.tipo === 'receita') {
          acc.total_receitas += valor
          
          // Separa por método
          if (t.metodo_pagamento?.toLowerCase().includes('pix')) acc.total_pix += valor
          else if (t.metodo_pagamento?.toLowerCase().includes('dinheiro')) acc.total_dinheiro += valor
          else if (t.metodo_pagamento?.toLowerCase().includes('cartão')) acc.total_cartao += valor
        } else {
          acc.total_despesas += valor
        }
        
        return acc
      }, {
        total_receitas: 0, total_despesas: 0, total_pix: 0, total_dinheiro: 0, total_cartao: 0, saldo_final: 0
      })

      resumo.saldo_final = resumo.total_receitas - resumo.total_despesas
      setSistema(resumo)
    }
    setLoading(false)
  }

  const calcularDiferenca = () => {
    const totalReal = Number(real.dinheiro || 0) + Number(real.cartao || 0) + Number(real.pix || 0)
    // Comparamos apenas as RECEITAS do sistema com o apurado
    setDiferenca(totalReal - sistema.total_receitas)
  }

  return (
    <main className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-8 h-8 text-emerald-600" />
            Fechamento de Caixa
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Confira se o dinheiro bate com o sistema</p>
        </div>
        <input 
          type="date" 
          value={dataHj}
          onChange={(e) => setDataHj(e.target.value)}
          className="p-2 border rounded-lg bg-white dark:bg-gray-800 dark:text-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando dados do dia...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LADO ESQUERDO: O que o sistema diz */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              💻 Registrado no Sistema
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span>Vendas em Dinheiro</span>
                <span className="font-bold">R$ {sistema.total_dinheiro.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span>Vendas no Pix</span>
                <span className="font-bold">R$ {sistema.total_pix.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span>Vendas no Cartão</span>
                <span className="font-bold">R$ {sistema.total_cartao.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>
              
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>Total Receitas</span>
                <span>R$ {sistema.total_receitas.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>(-) Saídas/Despesas</span>
                <span>R$ {sistema.total_despesas.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black mt-2 pt-2 border-t dark:border-gray-600">
                <span>Saldo Teórico</span>
                <span>R$ {sistema.saldo_final.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: O que você contou */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              💵 Conferência (Real)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dinheiro na Gaveta</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={real.dinheiro}
                    onChange={e => setReal({...real, dinheiro: e.target.value})}
                    className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Pix (App do Banco)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={real.pix}
                    onChange={e => setReal({...real, pix: e.target.value})}
                    className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Maquininha (Cartão)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={real.cartao}
                    onChange={e => setReal({...real, cartao: e.target.value})}
                    className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Resultado da Conferência */}
              <div className={`mt-6 p-4 rounded-xl border-2 text-center ${
                diferenca === 0 ? 'border-green-200 bg-green-50 text-green-800' : 
                Math.abs(diferenca) < 1 ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
                'border-red-200 bg-red-50 text-red-800'
              }`}>
                <div className="text-sm font-semibold uppercase mb-1">Diferença</div>
                <div className="text-3xl font-bold">
                  {diferenca > 0 ? '+' : ''} R$ {diferenca.toFixed(2)}
                </div>
                <div className="text-xs mt-1 flex justify-center items-center gap-1">
                  {diferenca === 0 && <><CheckCircle size={14}/> Caixa Bateu Perfeitamente!</>}
                  {diferenca > 0 && <><AlertCircle size={14}/> Sobrando dinheiro (Não registrado?)</>}
                  {diferenca < 0 && <><AlertCircle size={14}/> Faltando dinheiro (Perda?)</>}
                </div>
              </div>

              <button className="w-full mt-4 bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
                <Save size={18} />
                Salvar Fechamento
              </button>
            </div>
          </div>

        </div>
      )}
    </main>
  )
}