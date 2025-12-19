'use client';

import { useState, useEffect } from 'react';
// REMOVIDO: Importação quebrada do auth-helpers
// ADICIONADO: Importação do lib local
import { supabase } from '../../lib/supabaseClient';
import { Plus, Car, Trash2, ArrowLeft, Fuel, Calendar } from 'lucide-react';
import MaintenanceManager from './MaintenanceManager';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: string;
  color: string;
}

export default function VehicleModule() {
  // REMOVIDO: const supabase = createClientComponentClient();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
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

    const { error } = await supabase
      .from('vehicles')
      .insert({
        user_id: user.id,
        brand: newVehicle.brand,
        model: newVehicle.model,
        plate: newVehicle.plate,
        year: newVehicle.year,
        color: newVehicle.color
      });

    if (error) {
      alert('Erro ao cadastrar veículo.');
      console.error(error);
    } else {
      setIsAddModalOpen(false);
      setNewVehicle({ brand: '', model: '', plate: '', year: '', color: '' });
      fetchVehicles();
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará o veículo e TODO o histórico de manutenções dele.')) return;

    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir.');
    } else {
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
      fetchVehicles();
    }
  };

  if (!selectedVehicle) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Meus Veículos</h2>
            <p className="text-gray-500 text-sm">Gerencie sua frota e manutenções</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-blue-200 shadow-lg"
          >
            <Plus size={20} /> Adicionar Veículo
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-10">Carregando veículos...</p>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum veículo cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div 
                key={v.id} 
                onClick={() => setSelectedVehicle(v)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition">
                    <Car className="text-blue-600" size={24} />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v.id); }}
                    className="text-gray-300 hover:text-red-500 transition p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gray-800">{v.brand} {v.model}</h3>
                <p className="text-sm text-gray-500 mb-4">{v.year} • {v.color}</p>
                <div className="bg-gray-50 px-3 py-1 rounded text-xs font-mono text-gray-600 inline-block border border-gray-200">
                  {v.plate.toUpperCase()}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Ver Detalhes & Manutenções</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Novo Veículo</h3>
              <div className="space-y-3">
                <input placeholder="Marca (Ex: Audi)" className="w-full border p-2 rounded" value={newVehicle.brand} onChange={e => setNewVehicle({...newVehicle, brand: e.target.value})} />
                <input placeholder="Modelo (Ex: RS4)" className="w-full border p-2 rounded" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                <input placeholder="Placa" className="w-full border p-2 rounded" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} />
                <div className="flex gap-2">
                  <input placeholder="Ano" className="w-full border p-2 rounded" value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} />
                  <input placeholder="Cor" className="w-full border p-2 rounded" value={newVehicle.color} onChange={e => setNewVehicle({...newVehicle, color: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                <button onClick={handleAddVehicle} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <button 
        onClick={() => setSelectedVehicle(null)} 
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft size={20} /> Voltar para lista
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div className="bg-blue-600 p-4 rounded-xl text-white h-fit shadow-lg shadow-blue-200">
              <Car size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{selectedVehicle.brand} {selectedVehicle.model}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono border border-gray-200">{selectedVehicle.plate}</span>
                <span className="flex items-center gap-1 text-sm"><Calendar size={14}/> {selectedVehicle.year}</span>
                <span className="flex items-center gap-1 text-sm"><Fuel size={14}/> {selectedVehicle.color}</span>
              </div>
            </div>
          </div>
          <button 
             onClick={() => handleDeleteVehicle(selectedVehicle.id)}
             className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition" 
             title="Excluir Veículo"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="mt-8">
        <MaintenanceManager vehicleId={selectedVehicle.id} />
      </div>

    </div>
  );
}