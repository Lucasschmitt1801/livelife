'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Car, Trash2, ArrowLeft, Fuel, Calendar, X, Wrench } from 'lucide-react';
import MaintenanceManager from './MaintenanceManager';
import RefuelingManager from './RefuelingManager'; // <--- Importamos o novo módulo

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: string;
  color: string;
}

export default function VehicleModule() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Estado para controlar as ABAS
  const [activeTab, setActiveTab] = useState<'maintenance' | 'refueling'>('maintenance');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ brand: '', model: '', plate: '', year: '', color: '' });

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Erro ao buscar veículos:', error);
    else setVehicles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Faça login novamente.');

    const { error } = await supabase.from('vehicles').insert({
      user_id: user.id,
      brand: newVehicle.brand,
      model: newVehicle.model,
      plate: newVehicle.plate,
      year: newVehicle.year,
      color: newVehicle.color
    });

    if (error) {
      alert(`Erro no banco de dados: ${error.message}`);
    } else {
      setIsAddModalOpen(false);
      setNewVehicle({ brand: '', model: '', plate: '', year: '', color: '' });
      fetchVehicles();
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará o veículo e TODO o histórico dele.')) return;
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (!error) {
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
      fetchVehicles();
    }
  };

  // --- RENDERIZAÇÃO ---

  if (!selectedVehicle) {
    return (
      <div className="space-y-6 text-gray-100">
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Meus Veículos</h2>
            <p className="text-gray-400 text-sm">Gerencie sua frota e manutenções</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/50 border border-blue-500">
            <Plus size={20} /> Adicionar Veículo
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-10">Carregando veículos...</p>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-10 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <Car className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum veículo cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} onClick={() => setSelectedVehicle(v)} className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700 hover:border-blue-500/50 hover:shadow-xl transition cursor-pointer group relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-gray-700 p-3 rounded-lg group-hover:bg-blue-900/30 transition text-blue-400"><Car size={24} /></div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v.id); }} className="text-gray-500 hover:text-red-400 transition p-1"><Trash2 size={18} /></button>
                </div>
                <h3 className="text-xl font-bold text-white">{v.brand} {v.model}</h3>
                <p className="text-sm text-gray-400 mb-4">{v.year} • {v.color}</p>
                <div className="bg-gray-900/50 px-3 py-1 rounded text-xs font-mono text-gray-300 inline-block border border-gray-700">{v.plate.toUpperCase()}</div>
                <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center text-sm text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity"><span>Ver Detalhes</span><span>→</span></div>
              </div>
            ))}
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-2xl w-full max-w-md text-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Novo Veículo</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              <div className="space-y-4">
                <input placeholder="Marca (Ex: Audi)" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} />
                <input placeholder="Modelo (Ex: RS4)" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                <input placeholder="Placa" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white uppercase" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} />
                <div className="flex gap-3">
                  <input placeholder="Ano" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} />
                  <input placeholder="Cor" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-400">Cancelar</button>
                <button onClick={handleAddVehicle} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA 2: Detalhes do Veículo
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-gray-100">
      <button onClick={() => setSelectedVehicle(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" /> Voltar para lista
      </button>

      {/* HEADER DO CARRO */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex gap-5">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-xl text-white h-fit shadow-lg shadow-blue-900/50"><Car size={32} /></div>
            <div>
              <h1 className="text-3xl font-bold text-white">{selectedVehicle.brand} {selectedVehicle.model}</h1>
              <div className="flex items-center gap-4 mt-3 text-gray-400">
                <span className="bg-gray-900 px-3 py-1 rounded text-sm font-mono border border-gray-700 text-blue-200">{selectedVehicle.plate}</span>
                <span className="flex items-center gap-1 text-sm"><Calendar size={14}/> {selectedVehicle.year}</span>
                <span className="flex items-center gap-1 text-sm"><Fuel size={14}/> {selectedVehicle.color}</span>
              </div>
            </div>
          </div>
          <button onClick={() => handleDeleteVehicle(selectedVehicle.id)} className="text-gray-500 hover:text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition" title="Excluir Veículo"><Trash2 size={20} /></button>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO */}
      <div className="flex gap-4 border-b border-gray-700 mb-6">
        <button 
          onClick={() => setActiveTab('maintenance')}
          className={`pb-3 px-2 flex items-center gap-2 text-sm font-bold transition border-b-2 ${activeTab === 'maintenance' ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          <Wrench size={18} /> Manutenção & Peças
        </button>
        <button 
          onClick={() => setActiveTab('refueling')}
          className={`pb-3 px-2 flex items-center gap-2 text-sm font-bold transition border-b-2 ${activeTab === 'refueling' ? 'text-yellow-400 border-yellow-400' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          <Fuel size={18} /> Abastecimento & GNV
        </button>
      </div>

      {/* CONTEÚDO DA ABA */}
      {activeTab === 'maintenance' ? (
        <MaintenanceManager vehicleId={selectedVehicle.id} />
      ) : (
        <RefuelingManager vehicleId={selectedVehicle.id} />
      )}
    </div>
  );
}