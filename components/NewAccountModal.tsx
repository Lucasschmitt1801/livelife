'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Verifique se o caminho do lib está correto aqui
import { X, Wallet, Save } from 'lucide-react';

interface Account {
  id?: string;
  name: string;
  type: string;
  initial_balance: number;
  color: string;
}

// AQUI ESTAVA O PROBLEMA: A interface precisa aceitar isOpen e accountToEdit
interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; 
  accountToEdit?: Account | null; 
}

export default function NewAccountModal({ isOpen, onClose, onSave, accountToEdit }: NewAccountModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    initial_balance: '',
    color: '#3b82f6'
  });
  const [loading, setLoading] = useState(false);

  // Preenche o formulário se for edição
  useEffect(() => {
    if (accountToEdit) {
      setFormData({
        name: accountToEdit.name,
        type: accountToEdit.type,
        initial_balance: accountToEdit.initial_balance.toString(),
        color: accountToEdit.color || '#3b82f6'
      });
    } else {
      // Limpa se for novo
      setFormData({ name: '', type: 'checking', initial_balance: '', color: '#3b82f6' });
    }
  }, [accountToEdit, isOpen]);

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      name: formData.name,
      type: formData.type,
      initial_balance: parseFloat(formData.initial_balance || '0'),
      current_balance: parseFloat(formData.initial_balance || '0'), 
      color: formData.color
    };

    let error;

    if (accountToEdit?.id) {
      // ATUALIZAR (Update)
      const { error: updateError } = await supabase
        .from('financial_accounts')
        .update({
            name: formData.name,
            type: formData.type,
            color: formData.color,
            // initial_balance: payload.initial_balance // Opcional atualizar saldo inicial na edição
        })
        .eq('id', accountToEdit.id);
      error = updateError;
    } else {
      // CRIAR (Insert)
      const { error: insertError } = await supabase
        .from('financial_accounts')
        .insert(payload);
      error = insertError;
    }

    setLoading(false);

    if (error) {
      alert('Erro ao salvar conta: ' + error.message);
    } else {
      onSave(); // Atualiza a lista pai
      onClose(); // Fecha modal
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md text-gray-100 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="text-blue-500" />
            {accountToEdit ? 'Editar Conta' : 'Nova Conta'}
          </h3>
          <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 ml-1">Nome da Conta</label>
            <input 
              placeholder="Ex: Nubank, Carteira..." 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 ml-1">Tipo</label>
              <select 
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="checking">Corrente</option>
                <option value="savings">Poupança</option>
                <option value="investment">Investimento</option>
                <option value="cash">Dinheiro</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 ml-1">Cor</label>
              <input 
                type="color"
                className="w-full h-[46px] bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>

          {!accountToEdit && (
            <div>
              <label className="text-xs text-gray-400 ml-1">Saldo Inicial</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-blue-500 outline-none"
                  value={formData.initial_balance}
                  onChange={e => setFormData({...formData, initial_balance: e.target.value})}
                />
              </div>
            </div>
          )}
          
          {accountToEdit && (
             <p className="text-xs text-yellow-600 bg-yellow-900/20 p-2 rounded border border-yellow-900">
               Nota: Para evitar erros no histórico, o saldo inicial não pode ser alterado na edição.
             </p>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
            >
              <Save size={18} /> {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}