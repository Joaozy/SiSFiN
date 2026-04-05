'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusCircle, Wallet, Tag, FileText, CheckCircle2 } from 'lucide-react'

export default function RegistroPage() {
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Identifica o usuário logado
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('transacoes').insert({
      tipo,
      valor: parseFloat(valor.replace(',', '.')),
      categoria,
      descricao,
      data: new Date().toISOString(),
      usuario_id: user?.id || 'whatsapp', // Padrão caso não ache login
      metodo_pagamento: 'Site'
    })

    setLoading(false)
    if (!error) {
      setSucesso(true)
      setValor('')
      setCategoria('')
      setDescricao('')
      setTimeout(() => setSucesso(false), 4000)
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Nova Transação</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Registre manualmente uma receita ou despesa na plataforma.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-10">
        {sucesso && (
          <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 animate-in zoom-in">
            <CheckCircle2 size={24} />
            <p className="font-semibold">Transação guardada com sucesso!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor Despesa / Receita */}
          <div className="flex p-1.5 bg-gray-100 dark:bg-gray-900 rounded-2xl">
            <button type="button" onClick={() => setTipo('despesa')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${tipo === 'despesa' ? 'bg-white dark:bg-gray-800 text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Despesa
            </button>
            <button type="button" onClick={() => setTipo('receita')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all ${tipo === 'receita' ? 'bg-white dark:bg-gray-800 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Valor (R$)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Wallet size={20} /></div>
              <input type="number" step="0.01" required value={valor} onChange={(e) => setValor(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg font-bold dark:text-white outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Tag size={20} /></div>
              <input type="text" required value={categoria} onChange={(e) => setCategoria(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium dark:text-white outline-none"
                placeholder="Ex: Alimentação, Lazer, Salário"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><FileText size={20} /></div>
              <input type="text" required value={descricao} onChange={(e) => setDescricao(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium dark:text-white outline-none"
                placeholder="Ex: Almoço na padaria"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4.5 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 mt-4"
            style={{ paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
          >
            {loading ? 'A Guardar...' : <><PlusCircle size={24} /> Registar Transação</>}
          </button>
        </form>
      </div>
    </div>
  )
}