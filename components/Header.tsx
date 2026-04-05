'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, LogOut, RefreshCw } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  const navClass = (path: string) => `
    px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
    ${isActive(path) 
      ? 'bg-gray-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400' 
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }
  `

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 lg:gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent hidden sm:block">
                Finanças
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className={navClass('/dashboard')}>
                Dashboard
              </Link>
              <Link href="/registro" className={navClass('/registro')}>
                <PlusCircle className="w-4 h-4" />
                Novo
              </Link>
              <Link href="/gastos-recorrentes" className={navClass('/gastos-recorrentes')}>
                <RefreshCw className="w-4 h-4" />
                Assinaturas
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
               <ThemeToggle />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Menu Mobile Simplificado (só ícones das páginas ativas) */}
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 flex justify-around py-2">
            <Link href="/dashboard" className="p-2 text-emerald-600"><LayoutDashboard size={20}/></Link>
            <Link href="/registro" className="p-2 text-gray-600"><PlusCircle size={20}/></Link>
            <Link href="/gastos-recorrentes" className="p-2 text-gray-600"><RefreshCw size={20}/></Link>
        </div>
      </div>
    </header>
  )
}