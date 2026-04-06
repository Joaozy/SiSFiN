'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail, UserPlus, User, Phone, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSucesso(false)

    // 1. Cria a conta de Autenticação (Login)
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password 
    })

    if (authError) {
      setError('Erro ao criar conta: ' + authError.message)
      setLoading(false)
      return
    }

    // 2. Tenta salvar os dados pessoais
    if (authData.user) {
      // Deixa apenas os números
      let numeroLimpo = telefone.replace(/\D/g, '');
      
      // Se a pessoa digitou o 55, retiramos temporariamente para padronizar
      if (numeroLimpo.startsWith('55') && numeroLimpo.length > 11) {
        numeroLimpo = numeroLimpo.substring(2);
      }

      // ✂️ A TESOURA: Se sobrou 11 dígitos (DDD + 9 + 8 números) e o terceiro número for um '9', nós apagamos esse '9'
      if (numeroLimpo.length === 11 && numeroLimpo[2] === '9') {
        numeroLimpo = numeroLimpo.substring(0, 2) + numeroLimpo.substring(3);
      }

      // Recoca o 55 no início para garantir o formato do WhatsApp
      numeroLimpo = `55${numeroLimpo}`;

      const { error: dbError } = await supabase
        .from('usuarios_whatsapp')
        .insert({
          user_id: authData.user.id,
          nome: nome,
          cpf: cpf.replace(/\D/g, ''),
          telefone: numeroLimpo
        })

      if (dbError) {
        setError('Erro ao ligar número ao banco: ' + dbError.message)
        setLoading(false)
        return
      }

      setSucesso(true)
      setLoading(false)
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }

  return (
    <div className="flex items-center justify-center p-4 min-h-[85vh] py-12">
      {/* Efeitos de Fundo */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[0%] -right-[5%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 p-8 md:p-10">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg -rotate-3">
              <UserPlus className="w-8 h-8 text-white rotate-3" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Criar Conta</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Ative o seu assistente financeiro</p>
          </div>

          {sucesso ? (
            <div className="text-center p-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl border border-emerald-100 dark:border-emerald-800 animate-in zoom-in">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus size={32} />
              </div>
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Conta criada!</h3>
              <p className="text-emerald-600 dark:text-emerald-500">O seu número já está associado. Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-medium border border-rose-100 dark:border-rose-800 text-center animate-in shake">
                  {error}
                </div>
              )}

              {/* Linha 1: Nome Completo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><User size={20} /></div>
                  <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white outline-none"
                    placeholder="João Silva"
                  />
                </div>
              </div>

              {/* Linha 2: CPF e Celular lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">CPF</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><CreditCard size={20} /></div>
                    <input type="text" required value={cpf} onChange={(e) => setCpf(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white outline-none"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Celular (WhatsApp)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Phone size={20} /></div>
                    <input type="tel" required value={telefone} onChange={(e) => setTelefone(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white outline-none"
                      placeholder="(79) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {/* Linha 3: Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={20} /></div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white outline-none"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Linha 4: Senha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={20} /></div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-4 rounded-2xl font-bold text-lg shadow-md transition-all disabled:opacity-70 mt-6"
              >
                {loading ? 'Cadastrando e conectando ao Bot...' : 'Cadastrar e Ativar Bot'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Já tem uma conta?{' '}
              <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                Entre aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}