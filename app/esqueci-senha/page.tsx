'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    });

    if (error) {
      setErro(error.message);
    } else {
      setSucesso(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Recuperar Senha</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Enviaremos um link para redefinir a sua senha.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          {sucesso ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center"><CheckCircle2 className="h-12 w-12 text-emerald-500" /></div>
              <h3 className="text-lg font-medium text-gray-900">E-mail enviado!</h3>
              <p className="text-sm text-gray-500">Verifique a sua caixa de entrada (e o spam) para redefinir a sua senha.</p>
              <Link href="/login" className="mt-4 block text-sm font-medium text-emerald-600 hover:text-emerald-500">
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Seu E-mail</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="voce@email.com" />
                </div>
              </div>

              {erro && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{erro}</div>}

              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar link de recuperação'}
              </button>

              <div className="flex justify-center mt-4">
                <Link href="/login" className="flex items-center text-sm font-medium text-gray-600 hover:text-emerald-600">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}