'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface NewAccountModalProps {
  userId: string
  onAccountCreated: () => void // Função que será chamada quando terminar de salvar
}

export default function NewAccountModal({ userId, onAccountCreated }: NewAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Insere no banco de dados
      const { error } = await supabase.from('financial_accounts').insert({
        user_id: userId,
        name: name,
        initial_balance: parseFloat(balance),
        current_balance: parseFloat(balance) // Define o saldo atual igual ao inicial
      })

      if (error) throw error

      // Sucesso: Limpa os campos e fecha o modal
      setName('')
      setBalance('')
      setIsOpen(false)
      
      // Avisa a página pai para atualizar a lista
      onAccountCreated()
      
    } catch (error) {
      console.error('Erro ao criar conta:', error)
      alert('Erro ao criar conta. Verifique o console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition font-medium"
      >
        + Nova Conta
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Adicionar Conta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome da Conta</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Nubank, Carteira, Cofre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Saldo Atual (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
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
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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