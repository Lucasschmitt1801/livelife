'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Car, Fuel, Wrench, Gauge, Flame, Droplets, History, PlusCircle } from 'lucide-react'

interface VehicleModuleProps {
  session: any
}

export default function VehicleModule({ session }: VehicleModuleProps) {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  
  // View State (Tabs)
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formType, setFormType] = useState<'refuel' | 'service'>('refuel')
  const [fuelType, setFuelType] = useState<'liquid' | 'gnv'>('liquid') // Novo estado GNV
  
  const [km, setKm] = useState('')
  const [quantity, setQuantity] = useState('') // Litros ou m3
  const [totalCost, setTotalCost] = useState('')
  const [accountId, setAccountId] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchVehicles(); fetchAccounts(); }, [])
  useEffect(() => { if (selectedVehicle) { fetchLogs(selectedVehicle.id); setKm(selectedVehicle.current_km); } }, [selectedVehicle])

  async function fetchVehicles() {
    const { data } = await supabase.from('vehicles').select('*')
    if (data && data.length > 0) {
      setVehicles(data)
      setSelectedVehicle(data[0])
    }
  }

  async function fetchAccounts() {
    const { data } = await supabase.from('financial_accounts').select('*')
    if (data) setAccounts(data)
  }

  async function fetchLogs(vehicleId: string) {
    const { data } = await supabase.from('vehicle_events').select('*').eq('vehicle_id', vehicleId).order('date', { ascending: false }).order('km', { ascending: false }).limit(50)
    if (data) setLogs(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.rpc('add_vehicle_event', {
        p_user_id: session.user.id,
        p_vehicle_id: selectedVehicle.id,
        p_account_id: accountId,
        p_type: formType,
        p_fuel_type: formType === 'refuel' ? fuelType : null, // Envia o tipo
        p_km: parseInt(km),
        p_liters: formType === 'refuel' ? parseFloat(quantity) : null,
        p_total_cost: parseFloat(totalCost),
        p_description: desc || (formType === 'refuel' ? 'Abastecimento' : 'Manutenção')
      })
      if (error) throw error
      setIsFormOpen(false); setTotalCost(''); setQuantity(''); setDesc('');
      fetchVehicles(); fetchLogs(selectedVehicle.id);
    } catch (err) { console.error(err); alert("Erro ao salvar.") } finally { setLoading(false) }
  }

  // --- CÁLCULO DE ESTATÍSTICAS (Simplificado) ---
  // Filtra logs de abastecimento
  const refuels = logs.filter(l => l.type === 'refuel')
  
  // Função auxiliar para calcular médias
  const calculateStats = (type: 'liquid' | 'gnv') => {
    const events = refuels.filter(l => l.fuel_type === type)
    if (events.length < 2) return { avgCost: 0, totalSpent: 0 }
    
    // Custo total registrado
    const totalSpent = events.reduce((acc, curr) => acc + curr.total_cost, 0)
    const totalQty = events.reduce((acc, curr) => acc + curr.liters, 0)
    
    // Média simples de preço por unidade (L ou m3)
    const avgPrice = totalSpent / totalQty

    return { avgPrice, totalSpent, count: events.length }
  }

  const statsLiquid = calculateStats('liquid')
  const statsGnv = calculateStats('gnv')

  if (vehicles.length === 0) return <div className="text-center p-10 text-gray-500">Cadastre um veículo primeiro.</div>

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER DO CARRO */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-900/20 rounded-lg text-blue-400"><Car size={32} /></div>
          <div>
            <h2 className="text-xl font-bold text-white">{selectedVehicle?.name}</h2>
            <p className="text-gray-400 text-sm font-mono">{selectedVehicle?.plate}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-bold">Odômetro</p>
          <span className="text-2xl font-mono font-bold text-white">{selectedVehicle?.current_km} km</span>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex gap-4 border-b border-gray-700">
        <button onClick={() => setActiveTab('overview')} className={`pb-2 text-sm font-medium transition ${activeTab === 'overview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            Visão Geral & GNV
        </button>
        <button onClick={() => setActiveTab('history')} className={`pb-2 text-sm font-medium transition ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            Histórico Completo
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
            {/* CARDS COMPARATIVOS */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Card GNV */}
                <div className="bg-gray-800/50 p-5 rounded-lg border border-yellow-700/30 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                        <Flame className="text-yellow-500" />
                        <h3 className="font-bold text-gray-200">GNV (Gás Natural)</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total Gasto</span>
                            <span className="text-white font-mono">R$ {statsGnv.totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Abastecimentos</span>
                            <span className="text-white font-mono">{statsGnv.count}</span>
                        </div>
                    </div>
                </div>

                {/* Card Líquido */}
                <div className="bg-gray-800/50 p-5 rounded-lg border border-blue-700/30 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                        <Droplets className="text-blue-500" />
                        <h3 className="font-bold text-gray-200">Líquido (Gas/Etanol)</h3>
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Total Gasto</span>
                            <span className="text-white font-mono">R$ {statsLiquid.totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Abastecimentos</span>
                            <span className="text-white font-mono">{statsLiquid.count}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AÇÃO RÁPIDA */}
            <div className="grid grid-cols-2 gap-4">
                <button 
                onClick={() => { setFormType('refuel'); setIsFormOpen(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                <PlusCircle /> Abastecer
                </button>
                <button 
                onClick={() => { setFormType('service'); setIsFormOpen(true); }}
                className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                <Wrench size={20} /> Manutenção
                </button>
            </div>
        </div>
      )}

      {activeTab === 'history' && (
         <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            {logs.map(log => (
                <div key={log.id} className="p-4 border-b border-gray-700 last:border-0 flex justify-between items-center hover:bg-gray-750">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${log.fuel_type === 'gnv' ? 'bg-yellow-900/20 text-yellow-500' : 'bg-blue-900/20 text-blue-500'}`}>
                            {log.type === 'service' ? <Wrench size={18} /> : (log.fuel_type === 'gnv' ? <Flame size={18}/> : <Droplets size={18}/>)}
                        </div>
                        <div>
                            <p className="font-medium text-white">{log.description}</p>
                            <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()} • {log.km} km</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-white">R$ {log.total_cost.toFixed(2)}</p>
                        {log.liters && <p className="text-xs text-gray-500">{log.liters} {log.fuel_type === 'gnv' ? 'm³' : 'L'}</p>}
                    </div>
                </div>
            ))}
         </div>
      )}

      {/* MODAL DE LANÇAMENTO */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-2xl w-full max-w-md">
                <h3 className="text-lg font-bold text-white mb-4">Novo Lançamento</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Se for abastecimento, escolhe o tipo */}
                    {formType === 'refuel' && (
                        <div className="flex bg-gray-900 p-1 rounded">
                            <button type="button" onClick={() => setFuelType('liquid')} className={`flex-1 py-1 rounded text-sm ${fuelType === 'liquid' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Líquido</button>
                            <button type="button" onClick={() => setFuelType('gnv')} className={`flex-1 py-1 rounded text-sm ${fuelType === 'gnv' ? 'bg-yellow-600 text-white' : 'text-gray-400'}`}>GNV</button>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400">KM Atual</label>
                            <input type="number" required value={km} onChange={e => setKm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Total (R$)</label>
                            <input type="number" step="0.01" required value={totalCost} onChange={e => setTotalCost(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                        </div>
                    </div>
                    {formType === 'refuel' && (
                        <div>
                            <label className="text-xs text-gray-400">Quantidade ({fuelType === 'gnv' ? 'm³' : 'Litros'})</label>
                            <input type="number" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-gray-400">Conta</label>
                        <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                            <option value="">Selecione...</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 px-4">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Salvar</button>
                    </div>
                </form>
           </div>
        </div>
      )}
    </div>
  )
}