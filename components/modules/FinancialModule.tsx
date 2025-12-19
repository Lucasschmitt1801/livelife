'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Wallet, TrendingUp, TrendingDown, Edit2, Trash2, DollarSign } from 'lucide-react';
import NewAccountModal from '../NewAccountModal';
import NewTransactionModal from '../NewTransactionModal';
import FinancialChart from '../FinancialChart';

export default function FinancialModule() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  // Estado para Edição
  const [accountToEdit, setAccountToEdit] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: accs } = await supabase.from('financial_accounts').select('*').order('created_at', { ascending: true });
    const { data: trans } = await supabase.from('financial_transactions').select('*').order('date', { ascending: false }).limit(20);
    
    setAccounts(accs || []);
    setTransactions(trans || []);
    setLoading(false);
  };

  // --- AÇÕES DE CONTA ---

  const handleEditAccount = (account: any) => {
    setAccountToEdit(account);
    setIsAccountModalOpen(true);
  };

  const handleCreateAccount = () => {
    setAccountToEdit(null); // Modo criação
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará a conta e TODAS as transações dela.')) return;
    
    const { error } = await supabase.from('financial_accounts').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      fetchData();
    }
  };

  // Totais
  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.current_balance || 0), 0);

  return (
    <div className="space-y-6 text-gray-100 animate-in fade-in">
      
      {/* HEADER SALDO GERAL */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-xl border border-blue-800 shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-gray-300 text-sm font-medium flex items-center gap-2">
            <Wallet size={18} /> Saldo Total
          </h2>
          <p className="text-4xl font-bold text-white mt-1">R$ {totalBalance.toFixed(2)}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition"
          >
            <Plus size={18} /> Nova Transação
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* COLUNA 1: MINHAS CONTAS (Com Edição/Exclusão) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-lg">Minhas Contas</h3>
            <button onClick={handleCreateAccount} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Plus size={14} /> Nova Conta
            </button>
          </div>

          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-md group relative hover:border-blue-500/50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700/50" style={{ color: acc.color }}>
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{acc.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{acc.type === 'checking' ? 'Corrente' : acc.type === 'savings' ? 'Poupança' : acc.type}</p>
                    </div>
                  </div>
                  <p className="font-mono font-medium text-lg">R$ {acc.current_balance?.toFixed(2)}</p>
                </div>

                {/* Botões de Ação (Aparecem no Hover) */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 p-1 rounded-lg border border-gray-700">
                  <button 
                    onClick={() => handleEditAccount(acc)} 
                    className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteAccount(acc.id)} 
                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
                <p className="text-gray-500 text-sm">Nenhuma conta cadastrada</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 2 e 3: GRÁFICOS E TRANSAÇÕES (Mantido igual) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Gráfico */}
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> Fluxo de Caixa</h3>
            <div className="h-64">
               {/* Passamos as transações para o componente de gráfico que você já tem */}
               <FinancialChart transactions={transactions} />
            </div>
          </div>

          {/* Últimas Transações */}
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl shadow-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500"/> Últimas Transações</h3>
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                      {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{t.description}</p>
                      <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-gray-500 text-sm italic">Nenhuma transação recente.</p>}
            </div>
          </div>

        </div>
      </div>

      {/* MODAIS */}
      <NewAccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        onSave={fetchData} 
        accountToEdit={accountToEdit} // Passamos a conta para editar aqui
      />

      <NewTransactionModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)} 
        onSave={fetchData} 
        accounts={accounts}
      />
    </div>
  );
}