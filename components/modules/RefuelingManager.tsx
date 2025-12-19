'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Trash2, Fuel, Calculator, X, Zap } from 'lucide-react';

interface RefuelingRecord {
  id: string;
  date: string;
  fuel_type: string;
  price_per_unit: number;
  quantity: number;
  total_cost: number;
  km: number;
}

interface Props {
  vehicleId: string;
}

export default function RefuelingManager({ vehicleId }: Props) {
  const [history, setHistory] = useState<RefuelingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modais
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Form Abastecimento
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fuel_type: 'gasolina',
    price: '',
    quantity: '',
    total: '',
    km: ''
  });

  // Calculadora GNV
  const [calcData, setCalcData] = useState({ priceGas: '', priceGnv: '', efficiencyGas: '10', efficiencyGnv: '13' });
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // --- FUNÇÕES DE DADOS ---
  const fetchRefueling = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vehicle_refueling')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false });
    
    if (data) setHistory(data);
    setLoading(false);
  };

  useEffect(() => { fetchRefueling(); }, [vehicleId]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Se o usuário preencheu unitário e quantidade, calcula o total, ou vice-versa
    let total = Number(formData.total);
    if (!total && formData.price && formData.quantity) {
      total = Number(formData.price) * Number(formData.quantity);
    }

    const { error } = await supabase.from('vehicle_refueling').insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      date: formData.date,
      fuel_type: formData.fuel_type,
      price_per_unit: Number(formData.price),
      quantity: Number(formData.quantity),
      total_cost: total,
      km: Number(formData.km)
    });

    if (!error) {
      setIsAddOpen(false);
      setFormData({ date: new Date().toISOString().split('T')[0], fuel_type: 'gasolina', price: '', quantity: '', total: '', km: '' });
      fetchRefueling();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar este registro?')) return;
    await supabase.from('vehicle_refueling').delete().eq('id', id);
    fetchRefueling();
  };

  // --- LÓGICA CALCULADORA ---
  const calculateGnv = () => {
    const pGas = Number(calcData.priceGas);
    const pGnv = Number(calcData.priceGnv);
    const kmGas = Number(calcData.efficiencyGas); // km/l
    const kmGnv = Number(calcData.efficiencyGnv); // km/m3

    if (!pGas || !pGnv || !kmGas || !kmGnv) return;

    const costPerKmGas = pGas / kmGas;
    const costPerKmGnv = pGnv / kmGnv;
    const savings = ((costPerKmGas - costPerKmGnv) / costPerKmGas) * 100;

    if (savings > 0) {
      setCalcResult(`O GNV é ${savings.toFixed(1)}% mais econômico! Economia de R$ ${(costPerKmGas - costPerKmGnv).toFixed(2)} por KM.`);
    } else {
      setCalcResult(`A Gasolina está valendo mais a pena! (Diferença de ${Math.abs(savings).toFixed(1)}%)`);
    }
  };

  return (
    <div className="mt-6 border-t border-gray-700 pt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Fuel className="w-5 h-5 text-yellow-500" /> Histórico de Abastecimento
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setIsCalcOpen(true)} className="bg-gray-800 text-blue-300 border border-blue-900/50 px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-700 transition">
            <Calculator size={16} /> Comparar GNV
          </button>
          <button onClick={() => setIsAddOpen(true)} className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-yellow-700 transition">
            <Plus size={16} /> Abastecer
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {history.map(item => (
          <div key={item.id} className="bg-gray-800 border border-gray-700 p-4 rounded-xl flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-500 font-bold uppercase text-sm">{item.fuel_type}</span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-gray-300 text-sm">{new Date(item.date).toLocaleDateString()}</span>
              </div>
              <div className="text-sm text-gray-400">
                {item.quantity}L x R$ {item.price_per_unit.toFixed(2)} {item.km ? `• ${item.km} km` : ''}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white font-bold text-lg">R$ {item.total_cost.toFixed(2)}</span>
              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-900/20 p-2 rounded"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {!loading && history.length === 0 && <p className="text-gray-500 text-center text-sm">Nenhum abastecimento registrado.</p>}
      </div>

      {/* MODAL ABASTECER */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-sm">
            <h3 className="text-white font-bold mb-4">Novo Abastecimento</h3>
            <div className="space-y-3">
              <input type="date" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <select className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" value={formData.fuel_type} onChange={e => setFormData({...formData, fuel_type: e.target.value})}>
                <option value="gasolina">Gasolina</option>
                <option value="gnv">GNV</option>
                <option value="etanol">Etanol</option>
                <option value="diesel">Diesel</option>
              </select>
              <input type="number" placeholder="Preço unitário (R$)" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <input type="number" placeholder="Quantidade (L ou m³)" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              <input type="number" placeholder="Total Pago (R$)" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" value={formData.total} onChange={e => setFormData({...formData, total: e.target.value})} />
              <input type="number" placeholder="KM Atual" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" value={formData.km} onChange={e => setFormData({...formData, km: e.target.value})} />
              
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsAddOpen(false)} className="text-gray-400 px-4">Cancelar</button>
                <button onClick={handleSave} className="bg-yellow-600 text-white px-4 py-2 rounded">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CALCULADORA GNV */}
      {isCalcOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold flex items-center gap-2"><Zap size={18} className="text-blue-400"/> GNV vs Gasolina</h3>
              <button onClick={() => setIsCalcOpen(false)}><X className="text-gray-500"/></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Preço Gasolina</label>
                  <input type="number" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" placeholder="5.99" value={calcData.priceGas} onChange={e => setCalcData({...calcData, priceGas: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Km/L Gasolina</label>
                  <input type="number" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" placeholder="10" value={calcData.efficiencyGas} onChange={e => setCalcData({...calcData, efficiencyGas: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Preço GNV (m³)</label>
                  <input type="number" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" placeholder="4.50" value={calcData.priceGnv} onChange={e => setCalcData({...calcData, priceGnv: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Km/m³ GNV</label>
                  <input type="number" className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2" placeholder="13" value={calcData.efficiencyGnv} onChange={e => setCalcData({...calcData, efficiencyGnv: e.target.value})} />
                </div>
              </div>

              <button onClick={calculateGnv} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Calcular</button>
              
              {calcResult && (
                <div className={`p-3 rounded text-sm font-medium ${calcResult.includes('GNV') ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-red-900/30 text-red-300 border border-red-800'}`}>
                  {calcResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}