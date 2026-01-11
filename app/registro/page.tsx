'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react'

// Categorias em Português (iguais ao banco/IA)
const CATEGORIAS_DESPESAS = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Lazer', 'Educação', 'Compras', 'Serviços', 'Outros'
]

const CATEGORIAS_RECEITAS = [
  'Salário', 'Vendas', 'Freelance', 'Investimentos', 'Presente', 'Outros'
]

const METODOS_PAGAMENTO = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência']

export default function RegistroPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [metodo_pagamento, setMetodoPagamento] = useState('Pix')
  const [registrado_por, setRegistradoPor] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const categoriasAtuais = tipo === 'despesa' ? CATEGORIAS_DESPESAS : CATEGORIAS_RECEITAS

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (!valor || parseFloat(valor) <= 0) {
        throw new Error('O valor deve ser maior que 0')
      }
      if (!categoria) {
        throw new Error('Selecione uma categoria')
      }

      // Pegar usuário atual para salvar ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Você precisa estar logado')

      let foto_url = null

      // Subir foto se existir
      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`
        const { error: uploadError } = await supabase.storage
          .from('comprovantes') // Certifique-se de criar este bucket no Supabase Storage
          .upload(fileName, foto)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(fileName)

        foto_url = urlData.publicUrl
      }

      // Inserir na tabela 'transacoes'
      const { error: insertError } = await supabase
        .from('transacoes')
        .insert({
          tipo,
          valor: parseFloat(valor),
          categoria,
          // Se não tiver descrição, cria uma automática
          descricao: descricao || `${tipo === 'despesa' ? 'Gasto' : 'Receita'} - ${categoria}`,
          metodo_pagamento,
          foto_url,
          usuario_id: user.id,
          data: new Date().toISOString(), // Data de hoje
        })

      if (insertError) throw insertError

      setSuccess(true)

      // Limpar campos
      setValor('')
      setCategoria('')
      setDescricao('')
      setFoto(null)
      setFotoPreview(null)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar transação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Registrar Movimentação
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 border border-gray-100 dark:border-gray-700">
        {/* Botões de Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Transação
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => { setTipo('despesa'); setCategoria('') }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all shadow-md ${
                tipo === 'despesa'
                  ? 'bg-red-500 text-white ring-2 ring-red-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => { setTipo('receita'); setCategoria('') }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all shadow-md ${
                tipo === 'receita'
                  ? 'bg-green-500 text-white ring-2 ring-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Receita
            </button>
          </div>
        </div>

        {/* Valor */}
        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valor (R$) *
          </label>
          <input
            type="number"
            id="valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            step="0.01"
            min="0"
            required
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categoria *
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Selecione...</option>
            {categoriasAtuais.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição (Opcional)
          </label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            placeholder="Ex: Almoço com cliente..."
          />
        </div>

        {/* Método de Pagamento */}
        <div>
          <label htmlFor="metodo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Método de Pagamento
          </label>
          <select
            id="metodo"
            value={metodo_pagamento}
            onChange={(e) => setMetodoPagamento(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            {METODOS_PAGAMENTO.map((metodo) => (
              <option key={metodo} value={metodo}>{metodo}</option>
            ))}
          </select>
        </div>

        {/* Upload de Foto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Comprovante / Foto (Opcional)
          </label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-emerald-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700/30 relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {fotoPreview ? (
              <img src={fotoPreview} alt="Preview" className="h-32 object-contain rounded-lg shadow-sm" />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {foto ? foto.name : 'Clique para enviar foto'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mensagens de Sucesso/Erro */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800 animate-fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>Transação registrada com sucesso!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 animate-fade-in">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Botão Salvar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-bold hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>Registrar {tipo === 'despesa' ? 'Despesa' : 'Receita'}</>
          )}
        </button>
      </form>
    </main>
  )
}