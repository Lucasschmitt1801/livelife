'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Wallet, GraduationCap, Car, Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

interface HomeModuleProps { session: any }

export default function HomeModule({ session }: HomeModuleProps) {
  // Estados de Resumo
  const [balance, setBalance] = useState(0)
  const [academicProgress, setAcademicProgress] = useState(0)
  const [vehicleStatus, setVehicleStatus] = useState({ name: '', km: 0 })
  
  // Estados do Calendário
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchFinancialSummary()
    fetchAcademicSummary()
    fetchVehicleSummary()
    fetchEvents()
  }, [currentDate]) // Recarrega eventos se mudar o mês

  // --- BUSCAS DE DADOS ---

  async function fetchFinancialSummary() {
    const { data } = await supabase.from('financial_accounts').select('current_balance, initial_balance')
    if (data) {
      const total = data.reduce((acc, curr) => acc + (curr.current_balance ?? curr.initial_balance), 0)
      setBalance(total)
    }
  }

  async function fetchAcademicSummary() {
    const { data } = await supabase.from('academic_subjects').select('status')
    if (data) {
      const total = data.length
      const completed = data.filter(s => s.status === 'completed').length
      setAcademicProgress(total > 0 ? (completed / total) * 100 : 0)
    }
  }

  async function fetchVehicleSummary() {
    const { data } = await supabase.from('vehicles').select('*').limit(1).single()
    if (data) setVehicleStatus({ name: data.name, km: data.current_km })
  }

  async function fetchEvents() {
    // 1. Eventos Manuais
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString()

    const { data: manualEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', startOfMonth)
      .lte('start_time', endOfMonth)

    // 2. Eventos de Veículo (Manutenções/Abastecimentos)
    const { data: vehicleLogs } = await supabase
      .from('vehicle_events')
      .select('*')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)

    // Unificar tudo
    const formattedVehicleEvents = (vehicleLogs || []).map((log: any) => ({
      id: log.id,
      title: `${log.description} (R$ ${log.total_cost})`,
      start_time: log.date, // Data do log vira data do evento
      type: 'vehicle', // Cor diferente
      is_vehicle: true
    }))

    setEvents([...(manualEvents || []), ...formattedVehicleEvents])
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!newEventTitle || !selectedDate) return

    // Ajustar data para gravar corretamente (evitar timezone issues simples)
    const dateToSave = new Date(selectedDate)
    dateToSave.setHours(12, 0, 0, 0) 

    const { error } = await supabase.from('calendar_events').insert({
      user_id: session.user.id,
      title: newEventTitle,
      start_time: dateToSave.toISOString(),
      type: 'general'
    })

    if (!error) {
      setNewEventTitle('')
      setIsModalOpen(false)
      fetchEvents()
    }
  }

  async function deleteEvent(id: string) {
    if(!confirm("Apagar evento?")) return
    await supabase.from('calendar_events').delete().eq('id', id)
    fetchEvents()
  }

  // --- LÓGICA DO CALENDÁRIO ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1))
  }

  // Filtrar eventos do dia
  const getEventsForDay = (day: number) => {
    return events.filter(e => {
        const eventDate = new Date(e.start_time)
        return eventDate.getDate() === day && eventDate.getMonth() === currentDate.getMonth()
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER: RESUMOS */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Card Financeiro */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 rounded-lg shadow-lg border border-blue-700/50 text-white">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded"><Wallet size={20} /></div>
                <span className="font-medium text-blue-100">Saldo Atual</span>
            </div>
            <p className="text-3xl font-bold">R$ {balance.toFixed(2)}</p>
        </div>

        {/* Card Acadêmico */}
        <div className="bg-gradient-to-br from-emerald-900 to-green-900 p-6 rounded-lg shadow-lg border border-emerald-700/50 text-white">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded"><GraduationCap size={20} /></div>
                <span className="font-medium text-emerald-100">Faculdade</span>
            </div>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{academicProgress.toFixed(0)}%</p>
                <span className="text-xs text-emerald-200 mb-1">Concluído</span>
            </div>
            {/* Mini Barra */}
            <div className="w-full bg-black/20 h-1.5 rounded-full mt-2">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${academicProgress}%` }}></div>
            </div>
        </div>

        {/* Card Veículo */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 text-white">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded"><Car size={20} /></div>
                <span className="font-medium text-gray-300">Veículo Principal</span>
            </div>
             {vehicleStatus.name ? (
                <>
                    <p className="text-xl font-bold truncate">{vehicleStatus.name}</p>
                    <p className="text-sm text-gray-400 font-mono mt-1">{vehicleStatus.km} km rodados</p>
                </>
             ) : (
                <p className="text-sm text-gray-500 mt-2">Nenhum veículo cadastrado</p>
             )}
        </div>
      </div>

      {/* CALENDÁRIO GRANDE */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
        {/* Header do Calendário */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700 bg-gray-900">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarIcon className="text-blue-500" /> 
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronLeft /></button>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronRight /></button>
            </div>
        </div>

        {/* Grid dos Dias */}
        <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-500 uppercase">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {emptyDays.map(d => <div key={`empty-${d}`} className="h-24 md:h-32 bg-transparent"></div>)}
                
                {days.map(day => {
                    const dayEvents = getEventsForDay(day)
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth()

                    return (
                        <div 
                            key={day} 
                            onClick={() => { setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)); setIsModalOpen(true); }}
                            className={`h-24 md:h-32 border border-gray-700 rounded-lg p-2 cursor-pointer hover:border-blue-500 transition relative group bg-gray-750 ${isToday ? 'bg-gray-700 ring-1 ring-blue-500' : ''}`}
                        >
                            <span className={`text-sm font-bold ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>{day}</span>
                            
                            {/* Botão + (Hover) */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                <Plus size={14} className="text-gray-400" />
                            </div>

                            {/* Lista de Eventos no Dia */}
                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[70%] custom-scrollbar">
                                {dayEvents.map(ev => (
                                    <div 
                                        key={ev.id} 
                                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${ev.is_vehicle ? 'bg-orange-900/30 text-orange-300 border border-orange-800' : 'bg-blue-900/30 text-blue-300 border border-blue-800'}`}
                                        title={ev.title}
                                        onClick={(e) => {
                                            if(!ev.is_vehicle) {
                                                e.stopPropagation();
                                                deleteEvent(ev.id);
                                            }
                                        }}
                                    >
                                        {ev.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      </div>

      {/* Modal de Adicionar Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-2xl w-full max-w-sm">
                <h3 className="text-lg font-bold text-white mb-4">
                    Agendar para {selectedDate?.toLocaleDateString()}
                </h3>
                <form onSubmit={handleAddEvent}>
                    <label className="text-xs text-gray-400 uppercase">Título do Evento</label>
                    <input 
                        type="text" autoFocus required
                        placeholder="Ex: Prova Grau B, Pagar Luz"
                        value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white mt-1 mb-4" 
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 px-4">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}