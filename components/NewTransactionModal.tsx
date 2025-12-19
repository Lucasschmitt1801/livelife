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

interface NewTransactionModalProps {
  userId: string
  accounts: Account[]
  onTransactionCreated: () => void
}

export default function NewTransactionModal({ userId, accounts, onTransactionCreated }: NewTransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Dados do Banco
  const [categories, setCategories] = useState<Category[]>([])

  // Formulário
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')

  // Buscar categorias ao abrir o componente ou mudar o tipo
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen, type]) // Recarrega se mudar entre Receita/Despesa

  async function fetchCategories() {
    const isExpense = type === 'expense'
    
    const { data } = await supabase
      .from('financial_categories')
      .select('*')
      .eq('is_expense', isExpense)
      .order('name', { ascending: true })
    
    if (data) setCategories(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId || !categoryId) {
      alert('Preencha todos os campos!')
      return
    }

    setLoading(true)

    try {
      // Chama a função atualizada no banco (agora com categoria)
      const { error } = await supabase.rpc('create_transaction', {
        p_user_id: userId,
        p_account_id: accountId,
        p_category_id: categoryId, // Novo campo
        p_description: description,
        p_amount: parseFloat(amount),
        p_is_expense: type === 'expense'
      })

      if (error) throw error

      // Reset
      setDescription('')
      setAmount('')
      setCategoryId('')
      setIsOpen(false)
      onTransactionCreated()
      
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      alert('Erro ao salvar. Verifique o console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition font-medium flex items-center gap-2"
      >
        <span>+</span> Transação
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Nova Movimentação</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Seletor Tipo */}
              <div className="flex bg-gray-900 rounded p-1 mb-4">
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategoryId(''); }}
                  className={`flex-1 py-1 rounded text-sm font-medium transition ${type === 'expense' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategoryId(''); }}
                  className={`flex-1 py-1 rounded text-sm font-medium transition ${type === 'income' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Receita
                </button>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Gasolina, Mensalidade"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Conta */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Conta</label>
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm focus:border-purple-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Categoria</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm focus:border-purple-500 outline-none"
                  >
                    <option value="">Selecione...</option>
                    {categories.length > 0 ? categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    )) : (
                      <option disabled>Carregando...</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white px-4 py-2 transition text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}