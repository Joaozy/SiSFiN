'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Lock, Save, Loader2, ShieldCheck, FileText } from 'lucide-react';

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Estados dos formulários
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  useEffect(() => {
    async function carregarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        
        const { data: perfil } = await supabase
          .from('usuarios_whatsapp')
          .select('nome, telefone, cpf')
          .eq('user_id', user.id)
          .single();

        if (perfil) {
          setNome(perfil.nome || '');
          setTelefone(perfil.telefone || '');
          setCpf(perfil.cpf || '');
        }
      }
      setLoading(false);
    }
    carregarPerfil();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Atualizar Dados no Banco (Tabela WhatsApp)
      const { error: dbError } = await supabase
        .from('usuarios_whatsapp')
        .update({ nome, telefone, cpf })
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // 2. Atualizar Autenticação (Email/Senha)
      const authUpdates: any = {};
      if (email !== user.email) authUpdates.email = email;
      if (novaSenha.trim() !== '') authUpdates.password = novaSenha;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      setMensagem({ tipo: 'sucesso', texto: 'Perfil atualizado com sucesso!' });
      setNovaSenha(''); // Limpa o campo de senha após salvar
    } catch (error: any) {
      setMensagem({ tipo: 'erro', texto: error.message || 'Erro ao salvar perfil.' });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-500 mt-1">Gerencie as suas informações pessoais e credenciais de acesso.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <form onSubmit={handleSalvar} className="p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DADOS PESSOAIS */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200"><User className="text-emerald-500"/> Dados Pessoais</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-5 w-5 text-gray-400" /></div>
                  <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp (com DDD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-gray-400" /></div>
                  <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} required placeholder="5511999999999" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Este é o número que o FinChat irá reconhecer.</p>
              </div>
            </div>

            {/* DADOS DE ACESSO */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200"><ShieldCheck className="text-emerald-500"/> Segurança</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail de Login</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alterar Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                  <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Deixe em branco para não alterar" minLength={6} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto">
              {mensagem.texto && (
                <div className={`text-sm px-4 py-2 rounded-lg ${mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {mensagem.texto}
                </div>
              )}
            </div>
            <button type="submit" disabled={salvando} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all disabled:opacity-50">
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Alterações
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}