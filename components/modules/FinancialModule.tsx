'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import NewAccountModal from '../NewAccountModal'
import NewTransactionModal from '../NewTransactionModal'
import EditTransactionModal from '../EditTransactionModal'
import FinancialChart from '../FinancialChart'
import ExpenseBreakdownChart from '../ExpenseBreakdownChart'
import { Wallet, List, PieChart } from 'lucide-react'

interface FinancialModuleProps { session: any }

export default function FinancialModule({ session }: FinancialModuleProps) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  
  // NAVEGAÇÃO INTERNA (ABAS)
  const [view, setView] = useState<'overview' | 'transactions'>('overview')

  async function fetchData() {
    if (!session?.user) return
    const { data: acc } = await supabase.from('financial_accounts').select('*').order('name')
    if (acc) setAccounts(acc)

    const { data: tx } = await supabase
      .from('transactions')
      .select(`*, financial_accounts (name), financial_categories (name, icon)`)
      .order('created_at', { ascending: false })
      .limit(100)
    if (tx) setTransactions(tx)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir?')) return
    await supabase.rpc('delete_transaction', { p_transaction_id: id })
    fetchData()
  }

  useEffect(() => { fetchData() }, [session])
  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.current_balance || curr.initial_balance), 0)

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-end bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div>
           <p className="text-gray-400 text-sm">Saldo Consolidado</p>
           <h1 className="text-4xl font-bold text-white mt-1">R$ {totalBalance.toFixed(2)}</h1>
        </div>
        
        {/* BOTÕES DE ABA */}
        <div className="flex bg-gray-900 p-1 rounded-lg mt-4 md:mt-0">
            <button 
                onClick={() => setView('overview')}
                className={`px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition ${view === 'overview' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
                <PieChart size={16} /> Visão Geral
            </button>
            <button 
                onClick={() => setView('transactions')}
                className={`px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition ${view === 'transactions' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
                <List size={16} /> Extrato
            </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA: VISÃO GERAL */}
      {view === 'overview' && (
        <div className="grid md:grid-cols-12 gap-6">
            {/* Contas (Lateral) */}
            <div className="md:col-span-4 bg-gray-800 p-6 rounded-lg border border-gray-700 h-fit">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-200">Minhas Contas</h3>
                    <NewAccountModal userId={session.user.id} onAccountCreated={fetchData} />
                </div>
                <div className="space-y-3">
                    {accounts.map(acc => (
                        <div key={acc.id} className="flex justify-between p-3 bg-gray-700/30 rounded border border-gray-700">
                            <span className="text-gray-300">{acc.name}</span>
                            <span className="font-mono text-white">R$ {acc.current_balance.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gráficos (Principal) */}
            <div className="md:col-span-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <FinancialChart transactions={transactions} />
                    <ExpenseBreakdownChart transactions={transactions} />
                </div>
            </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: EXTRATO */}
      {view === 'transactions' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                <h3 className="font-bold text-gray-200">Últimas Movimentações</h3>
                <NewTransactionModal userId={session.user.id} accounts={accounts} onTransactionCreated={fetchData} />
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="text-xs uppercase bg-gray-900 text-gray-300">
                    <tr>
                      <th className="px-6 py-4">Descrição</th>
                      <th className="px-6 py-4">Conta</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{t.financial_categories?.icon || '📄'}</span>
                                <div>
                                    <p className="font-medium text-white">{t.description}</p>
                                    <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">{t.financial_accounts?.name}</td>
                        <td className={`px-6 py-4 text-right font-mono font-bold ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {t.amount >= 0 ? '+' : ''} R$ {Math.abs(t.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <button onClick={() => { setEditingTransaction(t); setIsEditModalOpen(true); }} className="text-blue-400 hover:text-white mr-3">Editar</button>
                            <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-white">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        </div>
      )}

      <EditTransactionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={editingTransaction} accounts={accounts} onTransactionUpdated={fetchData} />
    </div>
  )
}