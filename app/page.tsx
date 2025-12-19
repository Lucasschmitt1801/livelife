'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { LayoutDashboard, GraduationCap, Car, Menu, X, Wallet, Home as HomeIcon } from 'lucide-react'

// Importar os Módulos
import HomeModule from '../components/modules/HomeModule' // NOVO
import FinancialModule from '../components/modules/FinancialModule'
import AcademicModule from '../components/modules/AcademicModule'
import VehicleModule from '../components/modules/VehicleModule'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  
  // Agora a tela padrão é 'home'
  const [currentModule, setCurrentModule] = useState<'home' | 'financeiro' | 'academico' | 'carro'>('home')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // --- LÓGICA DE AUTENTICAÇÃO ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">LiveLife Login</h1>
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#2563eb', brandAccent: '#1d4ed8' } } } }} 
            theme="dark" providers={[]} 
          />
        </div>
      </div>
    )
  }

  // Definição dos itens do Menu Lateral (Adicionado Home)
  const menuItems = [
    { id: 'home', label: 'Início', icon: HomeIcon },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet },
    { id: 'academico', label: 'Faculdade', icon: GraduationCap },
    { id: 'carro', label: 'Veículo', icon: Car },
  ]

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700 fixed h-full">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-blue-500" /> LiveLife
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentModule(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentModule === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <p className="text-xs text-gray-500 mb-2 truncate px-2">{session.user.email}</p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full text-center text-sm text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20 py-2 rounded transition"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 z-50">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <LayoutDashboard className="text-blue-500" size={20} /> LiveLife
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-gray-900 z-40 p-4 space-y-2">
           {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentModule(item.id as any); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg border border-gray-700 ${
                currentModule === item.id ? 'bg-blue-600 text-white' : 'text-gray-300'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
           <button onClick={() => supabase.auth.signOut()} className="w-full text-center text-red-400 py-4 mt-4 border border-red-900/30 rounded bg-red-900/10">Sair</button>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 md:ml-64 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* MÓDULOS */}
          {currentModule === 'home' && <HomeModule session={session} />}
          {currentModule === 'financeiro' && <FinancialModule session={session} />}
          {currentModule === 'academico' && <AcademicModule session={session} />}
          {currentModule === 'carro' && <VehicleModule />}

        </div>
      </main>
    </div>
  )
}