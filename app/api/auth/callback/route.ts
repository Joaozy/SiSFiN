import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  
  // O código que o Supabase envia na URL
  const code = searchParams.get('code');
  
  // Para onde redirecionar depois do login (padrão é ir para a home '/')
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    
    // Troca o código pela sessão do usuário
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Se deu tudo certo, redireciona o usuário logado para a página certa
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Se algo der errado, manda para a página de erro (ou login)
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}