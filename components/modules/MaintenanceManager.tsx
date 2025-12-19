'use client';

import { useState, useEffect } from 'react';
// REMOVIDO: import { createClientComponentClient } ...
// ADICIONADO: Importar do seu arquivo local
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
  // REMOVIDO: const supabase = createClientComponentClient();
  // Agora usamos a variável 'supabase' importada diretamente lá em cima.

  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form States
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
    if (!user) {
        alert('Usuário não logado');
        setProcessing(false);
        return;
    }

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
    <div className="mt-6 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Wrench className="w-5 h-5" /> Histórico Detalhado
        </h3>
        <button onClick={() => handleOpenModal()} className="bg-gray-900 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-800">
          <Plus size={16} /> Nova Manutenção
        </button>
      </div>

      <div className="space-y-3">
        {history.map(rec => (
          <div key={rec.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex gap-2 text-sm mb-2">
                  <span className={`px-2 rounded text-xs font-bold uppercase pt-0.5 ${rec.type === 'preventiva' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{rec.type}</span>
                  <span className="flex items-center gap-1 text-gray-500"><Calendar size={14}/> {new Date(rec.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 text-gray-500"><Activity size={14}/> {rec.km} km</span>
                </div>
                {rec.description && <p className="text-gray-700 font-medium text-sm mb-2">{rec.description}</p>}
                
                <div className="bg-gray-50 p-2 rounded text-sm text-gray-600 space-y-1">
                  {rec.maintenance_items?.map((item, i) => (
                    <div key={i} className="flex justify-between border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                      <span>{item.item_name}</span>
                      <span>R$ {item.item_price.toFixed(2)}</span>
                    </div>
                  ))}
                  {rec.labor_cost > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium pt-1">
                      <span>Mão de Obra</span>
                      <span>R$ {rec.labor_cost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-1 mt-1">
                    <span>Total</span>
                    <span>R$ {rec.total_cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-3">
                <button onClick={() => handleOpenModal(rec)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                <button onClick={() => handleDelete(rec.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
        {!loading && history.length === 0 && <p className="text-gray-500 text-sm italic text-center">Nenhum registro encontrado.</p>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-bold text-lg">{editingId ? 'Editar' : 'Nova'} Manutenção</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <input type="date" className="border rounded p-2 text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <input type="number" placeholder="KM" className="border rounded p-2 text-sm" value={formData.km} onChange={e => setFormData({...formData, km: e.target.value})} />
                <select className="border rounded p-2 text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                  <option value="preventiva">Preventiva</option>
                  <option value="corretiva">Corretiva</option>
                  <option value="estetica">Estética</option>
                </select>
              </div>
              <textarea placeholder="Descrição do serviço..." className="w-full border rounded p-2 text-sm h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-sm">Peças / Itens</span>
                  <button onClick={() => setFormItems([...formItems, {item_name: '', item_price: 0}])} className="text-blue-600 text-sm font-bold">+ Adicionar</button>
                </div>
                {formItems.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input className="border rounded p-2 text-sm flex-1" placeholder="Nome da peça" value={item.item_name} onChange={e => updateItem(i, 'item_name', e.target.value)} />
                    <input type="number" className="border rounded p-2 text-sm w-24" placeholder="R$" value={item.item_price} onChange={e => updateItem(i, 'item_price', parseFloat(e.target.value))} />
                    <button onClick={() => { const n = [...formItems]; n.splice(i, 1); setFormItems(n); }} className="text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>

              <div className="bg-gray-100 p-3 rounded flex justify-between items-center">
                <span className="text-sm font-medium">Mão de Obra (R$):</span>
                <input type="number" className="w-28 border rounded p-1 text-right text-sm" value={formData.laborCost} onChange={e => setFormData({...formData, laborCost: parseFloat(e.target.value)})} />
              </div>
              <div className="flex justify-between text-lg font-bold"><span>Total Geral:</span><span>R$ {grandTotal.toFixed(2)}</span></div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded">Cancelar</button>
              <button onClick={handleSave} disabled={processing} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">{processing ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}