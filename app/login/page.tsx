'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Lock, Mail, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log("🚀 [Login] 1. Iniciando tentativa de login...")
    console.log("📧 [Login] Email:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("📡 [Login] 2. Resposta do Supabase:", { data, error })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error("Erro desconhecido: Usuário veio vazio.")
      }

      console.log("✅ [Login] 3. Sucesso! ID:", data.user.id)
      console.log("🔄 [Login] 4. Forçando redirecionamento...")

      // TRUQUE: Usamos window.location em vez de router.push
      // Isso força o navegador a recarregar a página e ler os cookies novos
      window.location.href = '/' 

    } catch (err: any) {
      console.error("❌ [Login] Erro:", err)
      
      // Tratamento de mensagens amigáveis
      let msg = err.message
      if (msg.includes('Invalid login')) msg = 'Email ou senha incorretos.'
      if (msg.includes('not confirmed')) msg = 'Você precisa confirmar seu email antes de entrar.'
      
      setError(msg)
      setLoading(false) // Só destrava o botão se der erro
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Login</h1>
          <p className="text-gray-400">Acesse suas finanças</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded text-white focus:border-emerald-500"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded text-white focus:border-emerald-500"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded font-bold flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Entrando...
              </>
            ) : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Não tem uma conta?{' '}
            <Link href="/cadastro" className="text-emerald-400 hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}