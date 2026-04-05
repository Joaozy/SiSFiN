'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Lock, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex items-center justify-center p-4 min-h-[85vh]">
      {/* Efeitos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[0%] -right-[5%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 p-8 md:p-10">
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
              <LayoutDashboard className="w-8 h-8 text-white -rotate-3" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Bem-vindo</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Acesse sua inteligência financeira</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-medium border border-rose-100 dark:border-rose-800 text-center animate-in shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={20} /></div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white outline-none"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={20} /></div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all dark:text-white outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white py-4 rounded-2xl font-bold text-lg shadow-md transition-all disabled:opacity-70 mt-4"
            >
              {loading ? 'Entrando...' : <><ArrowRight size={20} /> Entrar na conta</>}
            </button>
          </form>

          {/* Botão de Cadastro */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Ainda não tem uma conta?{' '}
              <Link href="/cadastro" className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}