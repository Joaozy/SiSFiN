import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Este cliente gerencia automaticamente os Cookies para o Middleware
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)