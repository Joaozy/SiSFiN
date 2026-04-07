'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';

export default function AtualizarSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    // Verifica se o usuário chegou aqui através de um link de recuperação válido
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Está autorizado a trocar a senha
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      setErro(error.message);
      setLoading(false);
    } else {
      alert("Senha atualizada com sucesso!");
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Nova Senha</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Digite a nova senha</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type="password" required minLength={6} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              </div>
            </div>

            {erro && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{erro}</div>}

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar e Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}