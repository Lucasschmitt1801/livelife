'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, DollarSign, Save } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  accounts: any[]; // Recebe a lista de contas para o select
}

export default function NewTransactionModal({ isOpen, onClose, onSave, accounts }: NewTransactionModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense', // 'expense' ou 'income'
    account_id: '',
    date: new Date().toISOString().split('T')[0],
    category: 'outros'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!formData.account_id) return alert('Selecione uma conta!');
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    
    // 1. Salvar Transação
    const { error: transError } = await supabase.from('financial_transactions').insert({
      user_id: user.id,
      account_id: formData.account_id,
      description: formData.description,
      amount: amount,
      type: formData.type,
      date: formData.date,
      category: formData.category
    });

    if (transError) {
      alert('Erro ao salvar transação: ' + transError.message);
      setLoading(false);
      return;
    }

    // 2. Atualizar Saldo da Conta
    // Busca saldo atual
    const { data: acc } = await supabase.from('financial_accounts').select('current_balance').eq('id', formData.account_id).single();
    
    if (acc) {
      const newBalance = formData.type === 'income' 
        ? acc.current_balance + amount 
        : acc.current_balance - amount;

      await supabase.from('financial_accounts').update({ current_balance: newBalance }).eq('id', formData.account_id);
    }

    setLoading(false);
    
    // Limpar form
    setFormData({
      description: '',
      amount: '',
      type: 'expense',
      account_id: '',
      date: new Date().toISOString().split('T')[0],
      category: 'outros'
    });

    onSave(); // Atualiza a lista no pai
    onClose(); // Fecha modal
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md text-gray-100 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="text-emerald-500" /> Nova Transação
          </h3>
          <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
        </div>

        <div className="space-y-4">
          {/* Tipo (Receita / Despesa) */}
          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button 
              onClick={() => setFormData({...formData, type: 'expense'})}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition ${formData.type === 'expense' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Despesa
            </button>
            <button 
              onClick={() => setFormData({...formData, type: 'income'})}
              className={`flex-1 py-2 rounded-md text-sm font-bold transition ${formData.type === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-400 ml-1">Descrição</label>
            <input 
              placeholder="Ex: Mercado, Salário..." 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 ml-1">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-blue-500 outline-none"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 ml-1">Data</label>
              <input 
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 ml-1">Conta</label>
            <select 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
              value={formData.account_id}
              onChange={e => setFormData({...formData, account_id: e.target.value})}
            >
              <option value="">Selecione uma conta...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.current_balance?.toFixed(2)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 ml-1">Categoria</label>
            <select 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="alimentacao">Alimentação</option>
              <option value="transporte">Transporte</option>
              <option value="lazer">Lazer</option>
              <option value="contas">Contas Fixas</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 font-medium ${formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}