'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface Account {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  icon: string
  is_expense: boolean
}

// O que o modal precisa receber para funcionar
interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: any // Objeto da transação que está sendo editada
  accounts: Account[]
  onTransactionUpdated: () => void
}

export default function EditTransactionModal({ 
  isOpen, 
  onClose, 
  transaction, 
  accounts, 
  onTransactionUpdated 
}: EditTransactionModalProps) {
  
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  // Estados do Formulário
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')

  // 1. Quando o modal abre, preencher os campos com os dados da transação
  useEffect(() => {
    if (isOpen && transaction) {
      setDescription(transaction.description)
      setAmount(Math.abs(transaction.amount).toString()) // Remove o sinal negativo para editar
      setAccountId(transaction.account_id)
      setCategoryId(transaction.category_id)
      const isExp = transaction.amount < 0
      setType(isExp ? 'expense' : 'income')
      
      // Busca categorias do tipo correto
      fetchCategories(isExp)
    }
  }, [isOpen, transaction])

  // Busca categorias quando troca o tipo (Receita/Despesa)
  async function fetchCategories(isExpense: boolean) {
    const { data } = await supabase
      .from('financial_categories')
      .select('*')
      .eq('is_expense', isExpense)
      .order('name', { ascending: true })
    
    if (data) setCategories(data)
  }

  // Handler para trocar Receita <-> Despesa no form
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType)
    setCategoryId('') // Reseta categoria pois mudou o tipo
    fetchCategories(newType === 'expense')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Chama a função de UPDATE no banco
      const { error } = await supabase.rpc('update_transaction', {
        p_transaction_id: transaction.id,
        p_new_account_id: accountId,
        p_new_category_id: categoryId,
        p_new_description: description,
        p_new_amount: parseFloat(amount),
        p_is_expense: type === 'expense'
      })

      if (error) throw error

      onTransactionUpdated() // Avisa o pai
      onClose() // Fecha modal
      
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      alert('Erro ao atualizar.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm border border-gray-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        
        <h2 className="text-xl font-bold text-white mb-4">Editar Movimentação</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex bg-gray-900 rounded p-1 mb-4">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-1 rounded text-sm font-medium transition ${type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-1 rounded text-sm font-medium transition ${type === 'income' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Descrição</label>
            <input 
              type="text" required value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
            <input 
              type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Conta</label>
              <select required value={accountId} onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm outline-none">
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria</label>
              <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm outline-none">
                <option value="">Selecione...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white px-4 py-2 transition text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition text-sm font-medium disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}