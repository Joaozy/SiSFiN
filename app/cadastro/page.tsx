'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, User, Phone, FileText, Mail, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase' // Importando do arquivo centralizado
import { maskCPF, maskPhone } from '@/lib/masks'

export default function CadastroPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    celular: ''
  })

  const handleChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === 'cpf') formattedValue = maskCPF(value)
    if (field === 'celular') formattedValue = maskPhone(value)
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // 1. Criar o Usuário no Sistema de Autenticação (Auth)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Erro: Usuário Auth não criado.")

      console.log("✅ Usuário Auth criado:", authData.user.id)

      // 2. Criar o Perfil Público (Banco de Dados)
      const { error: profileError } = await supabase
        .from('perfil')
        .insert({
          id: authData.user.id, // OBRIGATÓRIO: Mesmo ID do Auth
          nome_completo: formData.nome,
          email: formData.email,
          cpf: formData.cpf,
          celular: formData.celular,
          whatsapp_verificado: true
        })

      if (profileError) {
        console.error("Erro perfil:", profileError)
        // Não travamos o fluxo aqui, pois o login principal já existe
      }

      // 3. Forçar o Login para garantir a sessão no navegador
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.senha
      })

      if (loginError) throw loginError

      alert("Cadastro realizado com sucesso!")
      router.push('/') // Vai para o Dashboard
      router.refresh() // Atualiza os componentes do servidor

    } catch (err: any) {
      console.error(err)
      setError(err.message || "Erro desconhecido ao cadastrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Cadastro</h1>
        
        <form onSubmit={handleCadastro} className="space-y-4">
           {/* Nome */}
           <div>
            <label className="text-gray-300 text-sm">Nome</label>
            <div className="relative mt-1">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input type="text" required value={formData.nome} onChange={e => handleChange('nome', e.target.value)} className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded text-white" />
            </div>
           </div>
           
           {/* CPF e Celular */}
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-gray-300 text-sm">CPF</label>
                <div className="relative mt-1">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input type="text" required value={formData.cpf} onChange={e => handleChange('cpf', e.target.value)} className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded text-white" maxLength={14} />
                </div>
             </div>
             <div>
                <label className="text-gray-300 text-sm">Celular</label>
                <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input type="text" required value={formData.celular} onChange={e => handleChange('celular', e.target.value)} className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded text-white" maxLength={15} />
                </div>
             </div>
           </div>

           {/* Email */}
           <div>
            <label className="text-gray-300 text-sm">Email</label>
            <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input type="email" required value={formData.email} onChange={e => handleChange('email', e.target.value)} className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded text-white" />
            </div>
           </div>

           {/* Senha */}
           <div>
            <label className="text-gray-300 text-sm">Senha</label>
             <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input type="password" required value={formData.senha} onChange={e => handleChange('senha', e.target.value)} className="w-full pl-10 p-3 bg-gray-900 border border-gray-600 rounded text-white" />
            </div>
           </div>

           {error && <p className="text-red-400 text-center bg-red-900/30 p-2 rounded">{error}</p>}

           <button type="submit" disabled={loading} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded flex justify-center items-center gap-2">
             {loading ? <Loader2 className="animate-spin" /> : <>Criar Conta <ArrowRight size={20}/></>}
           </button>
        </form>
        
        <div className="mt-4 text-center">
            <Link href="/login" className="text-emerald-400 text-sm">Já tenho conta? Fazer Login</Link>
        </div>
      </div>
    </div>
  )
}