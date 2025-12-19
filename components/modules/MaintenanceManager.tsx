'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import { Plus, Trash2, Edit2, Wrench, Save, X, Calendar, Activity } from 'lucide-react';

interface MaintenanceItem {
  id?: string;
  item_name: string;
  item_price: number;
}

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  date: string;
  km: number;
  type: 'preventiva' | 'corretiva' | 'estetica' | 'outros';
  description: string;
  labor_cost: number;
  total_cost: number;
  maintenance_items: MaintenanceItem[];
}

interface Props {
  vehicleId: string;
}

export default function MaintenanceManager({ vehicleId }: Props) {
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    km: '',
    type: 'preventiva',
    description: '',
    laborCost: 0
  });
  const [formItems, setFormItems] = useState<MaintenanceItem[]>([]);

  const fetchHistory = async () => {
    if (!vehicleId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicle_maintenance')
      .select('*, maintenance_items(*)')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false });

    if (!error) setHistory(data as any || []);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [vehicleId]);

  const handleOpenModal = (record?: MaintenanceRecord) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        date: record.date,
        km: record.km.toString(),
        type: record.type as any,
        description: record.description || '',
        laborCost: record.labor_cost
      });
      setFormItems(record.maintenance_items || []);
    } else {
      setEditingId(null);
      setFormData({ date: new Date().toISOString().split('T')[0], km: '', type: 'preventiva', description: '', laborCost: 0 });
      setFormItems([]);
    }
    setIsModalOpen(true);
  };

  const updateItem = (index: number, field: keyof MaintenanceItem, value: any) => {
    const newItems = [...formItems];
    // @ts-ignore
    newItems[index][field] = value;
    setFormItems(newItems);
  };

  const totalParts = formItems.reduce((acc, item) => acc + (Number(item.item_price) || 0), 0);
  const grandTotal = totalParts + (Number(formData.laborCost) || 0);

  const handleSave = async () => {
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Usuário não logado'); setProcessing(false); return; }

    const payload = {
      user_id: user.id,
      vehicle_id: vehicleId,
      date: formData.date,
      km: Number(formData.km),
      type: formData.type,
      description: formData.description,
      labor_cost: formData.laborCost,
      total_cost: grandTotal
    };

    let targetId = editingId;

    if (editingId) {
      const { error } = await supabase.from('vehicle_maintenance').update(payload).eq('id', editingId);
      if (error) { alert('Erro ao salvar'); setProcessing(false); return; }
    } else {
      const { data, error } = await supabase.from('vehicle_maintenance').insert(payload).select().single();
      if (error) { alert('Erro ao salvar'); setProcessing(false); return; }
      targetId = data.id;
    }

    if (targetId) {
      await supabase.from('maintenance_items').delete().eq('maintenance_id', targetId);
      if (formItems.length > 0) {
        const itemsPayload = formItems.map(i => ({
          maintenance_id: targetId,
          item_name: i.item_name,
          item_price: i.item_price
        }));
        await supabase.from('maintenance_items').insert(itemsPayload);
      }
    }

    setProcessing(false);
    setIsModalOpen(false);
    fetchHistory();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir manutenção e todas as peças?')) return;
    const { error } = await supabase.from('vehicle_maintenance').delete().eq('id', id);
    if (!error) fetchHistory();
  };

  return (
    <div className="mt-6 border-t border-gray-700 pt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-500" /> Histórico Detalhado
        </h3>
        <button onClick={() => handleOpenModal()} className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 hover:border-gray-500 transition">
          <Plus size={16} /> Nova Manutenção
        </button>
      </div>

      <div className="space-y-4">
        {history.map(rec => (
          <div key={rec.id} className="border border-gray-700 rounded-xl p-5 bg-gray-800 shadow-sm hover:border-blue-500/30 transition group">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex gap-3 text-sm mb-3 items-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    rec.type === 'preventiva' ? 'bg-green-900/30 text-green-400 border border-green-900' : 
                    rec.type === 'corretiva' ? 'bg-red-900/30 text-red-400 border border-red-900' : 
                    'bg-yellow-900/30 text-yellow-400 border border-yellow-900'
                  }`}>
                    {rec.type}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400"><Calendar size={14}/> {new Date(rec.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-gray-400"><Activity size={14}/> {rec.km} km</span>
                </div>
                {rec.description && <p className="text-gray-300 font-medium text-sm mb-3 pl-1">{rec.description}</p>}
                
                <div className="bg-gray-900/50 p-3 rounded-lg text-sm text-gray-400 space-y-2 border border-gray-700/50">
                  {rec.maintenance_items?.map((item, i) => (
                    <div key={i} className="flex justify-between border-b border-gray-700 pb-1 last:border-0 last:pb-0">
                      <span>{item.item_name}</span>
                      <span>R$ {item.item_price.toFixed(2)}</span>
                    </div>
                  ))}
                  {rec.labor_cost > 0 && (
                    <div className="flex justify-between text-blue-400 font-medium pt-1">
                      <span>Mão de Obra</span>
                      <span>R$ {rec.labor_cost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-100 border-t border-gray-600 pt-2 mt-1 text-base">
                    <span>Total</span>
                    <span>R$ {rec.total_cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button onClick={() => handleOpenModal(rec)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition"><Edit2 size={18}/></button>
                <button onClick={() => handleDelete(rec.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition"><Trash2 size={18}/></button>
              </div>
            </div>
          </div>
        ))}
        {!loading && history.length === 0 && <div className="p-8 text-center bg-gray-800/50 border border-dashed border-gray-700 rounded-xl"><p className="text-gray-500 text-sm">Nenhum registro encontrado.</p></div>}
      </div>

      {/* MODAL DARK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 text-gray-100">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
              <h3 className="font-bold text-xl text-white">{editingId ? 'Editar' : 'Nova'} Manutenção</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 ml-1 mb-1 block">Data</label>
                  <input type="date" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 ml-1 mb-1 block">KM</label>
                  <input type="number" placeholder="KM" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.km} onChange={e => setFormData({...formData, km: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 ml-1 mb-1 block">Tipo</label>
                  <select className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="preventiva">Preventiva</option>
                    <option value="corretiva">Corretiva</option>
                    <option value="estetica">Estética</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 ml-1 mb-1 block">Descrição do Serviço</label>
                <textarea placeholder="O que foi feito no veículo..." className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm h-24 focus:border-blue-500 outline-none text-white resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div className="border-t border-gray-700 pt-5">
                <div className="flex justify-between mb-3 items-center">
                  <span className="font-bold text-sm text-gray-300">Peças / Itens Trocados</span>
                  <button onClick={() => setFormItems([...formItems, {item_name: '', item_price: 0}])} className="text-blue-400 hover:text-blue-300 text-sm font-bold flex items-center gap-1">+ Adicionar Item</button>
                </div>
                {formItems.length === 0 && <p className="text-gray-600 text-sm italic mb-2">Nenhuma peça adicionada.</p>}
                
                <div className="space-y-2">
                  {formItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm flex-1 focus:border-blue-500 outline-none text-white" placeholder="Nome da peça" value={item.item_name} onChange={e => updateItem(i, 'item_name', e.target.value)} />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-2 text-gray-500 text-xs">R$</span>
                        <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 pl-8 text-sm focus:border-blue-500 outline-none text-white" placeholder="0.00" value={item.item_price} onChange={e => updateItem(i, 'item_price', parseFloat(e.target.value))} />
                      </div>
                      <button onClick={() => { const n = [...formItems]; n.splice(i, 1); setFormItems(n); }} className="text-red-500 hover:text-red-400 p-2 hover:bg-gray-800 rounded"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                <span className="text-sm font-medium text-gray-300">Custo Mão de Obra:</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-2 text-gray-500 text-xs">R$</span>
                  <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-2 pl-8 text-right text-sm focus:border-blue-500 outline-none text-white" value={formData.laborCost} onChange={e => setFormData({...formData, laborCost: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-between text-xl font-bold items-center px-2">
                <span className="text-white">Total Geral:</span>
                <span className="text-blue-400">R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-700 bg-gray-800/50 flex justify-end gap-3 rounded-b-xl sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-400 text-sm hover:text-white hover:bg-gray-700 rounded-lg transition">Cancelar</button>
              <button onClick={handleSave} disabled={processing} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-900/20 disabled:opacity-50">{processing ? 'Salvando...' : 'Salvar Manutenção'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}