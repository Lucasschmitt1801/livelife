'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface SubjectDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  subject: any
}

export default function SubjectDetailsModal({ isOpen, onClose, subject }: SubjectDetailsModalProps) {
  // Estados das Notas
  const [ga, setGa] = useState<string>('')
  const [gb, setGb] = useState<string>('')
  const [gc, setGc] = useState<string>('')
  
  // IDs para update (se já existirem no banco)
  const [ids, setIds] = useState({ ga: null, gb: null, gc: null })

  // Estados de Faltas
  const [absences, setAbsences] = useState(0)
  const [maxAbsences, setMaxAbsences] = useState(20)
  
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (isOpen && subject) {
      fetchDetails()
    }
  }, [isOpen, subject])

  async function fetchDetails() {
    // 1. Buscar notas e mapear para GA, GB, GC
    const { data: gradesData } = await supabase
      .from('academic_grades')
      .select('*')
      .eq('subject_id', subject.id)
    
    if (gradesData) {
      let foundIds = { ga: null, gb: null, gc: null }
      
      gradesData.forEach((item: any) => {
        if (item.name === 'Grau A') {
            setGa(item.grade.toString())
            foundIds.ga = item.id
        }
        if (item.name === 'Grau B') {
            setGb(item.grade.toString())
            foundIds.gb = item.id
        }
        if (item.name === 'Grau C') {
            setGc(item.grade.toString())
            foundIds.gc = item.id
        }
      })
      setIds(foundIds)
    }

    // 2. Buscar faltas
    const { data: subjectData } = await supabase
      .from('academic_subjects')
      .select('current_absences, max_absences')
      .eq('id', subject.id)
      .single()
    
    if (subjectData) {
      setAbsences(subjectData.current_absences || 0)
      if (subjectData.max_absences) setMaxAbsences(subjectData.max_absences)
    }
  }

  // --- LÓGICA DE CÁLCULO GA/GB/GC ---
  function calculateAverage() {
    const valGA = parseFloat(ga) || 0
    const valGB = parseFloat(gb) || 0
    const valGC = parseFloat(gc) || 0
    const hasGC = gc !== '' && !isNaN(parseFloat(gc))

    // Cenário 1: Sem Grau C (GA + 2GB) / 3
    const avgNormal = (valGA + (valGB * 2)) / 3

    if (!hasGC) return avgNormal

    // Cenário 2: GC substitui GA (Se GC > GA) -> (GC + 2GB) / 3
    const avgReplaceA = (valGC + (valGB * 2)) / 3

    // Cenário 3: GC substitui GB (Se GC > GB) -> (GA + 2GC) / 3
    // Nota: Substituir o GB é mais difícil pois ele tem peso 2.
    // A fórmula matemática correta para substituir o Grau B mantendo o peso 2 é usar o GC no lugar do GB.
    const avgReplaceB = (valGA + (valGC * 2)) / 3

    // O sistema beneficia o aluno: pega a maior média possível
    return Math.max(avgNormal, avgReplaceA, avgReplaceB)
  }

  const finalAverage = calculateAverage()
  const isPassing = finalAverage >= 6.0
  // Previsão: Quanto preciso no GB para passar? (Se tiver só GA)
  const valGA = parseFloat(ga) || 0
  const needInGB = Math.max(0, (18 - valGA) / 2) // (6*3 - GA) / 2

  // --- AÇÕES DE SALVAR ---

  async function handleSave() {
    setLoading(true)
    setFeedback('')

    try {
      // Função auxiliar para salvar ou atualizar nota
      const upsertGrade = async (name: string, value: string, id: string | null) => {
        if (value === '') {
            // Se limpou o campo e tinha ID, deleta
            if (id) await supabase.from('academic_grades').delete().eq('id', id)
            return
        }

        const payload = {
            subject_id: subject.id,
            name: name,
            grade: parseFloat(value),
            weight: name === 'Grau B' ? 2 : 1 // Peso 2 para GB, 1 para outros (apenas referência)
        }

        if (id) {
            await supabase.from('academic_grades').update(payload).eq('id', id)
        } else {
            await supabase.from('academic_grades').insert(payload)
        }
      }

      await upsertGrade('Grau A', ga, ids.ga)
      await upsertGrade('Grau B', gb, ids.gb)
      await upsertGrade('Grau C', gc, ids.gc)

      // Salvar faltas
      await supabase.from('academic_subjects').update({ current_absences: absences }).eq('id', subject.id)

      setFeedback('Salvo com sucesso!')
      
      // Recarregar IDs caso tenha criado novos
      fetchDetails()

    } catch (error) {
      console.error(error)
      setFeedback('Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !subject) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 w-full max-w-lg rounded-lg shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">{subject.name}</h2>
            <p className="text-blue-400 text-sm">Calculadora GA / GB / GC</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* PAINEL DE NOTAS */}
          <div className="space-y-4">
             {/* Grau A */}
             <div className="flex items-center justify-between bg-gray-900 p-3 rounded border border-gray-700">
                <label className="text-white font-medium w-24">Grau A</label>
                <input 
                    type="number" step="0.1" max="10" placeholder="0.0"
                    value={ga} onChange={e => setGa(e.target.value)}
                    className="bg-gray-800 border border-gray-600 text-white rounded p-2 w-24 text-center focus:border-blue-500 outline-none"
                />
             </div>

             {/* Grau B */}
             <div className="flex items-center justify-between bg-gray-900 p-3 rounded border border-gray-700">
                <label className="text-white font-medium w-24">Grau B</label>
                <div className="flex flex-col items-end">
                    <input 
                        type="number" step="0.1" max="10" placeholder="0.0"
                        value={gb} onChange={e => setGb(e.target.value)}
                        className="bg-gray-800 border border-gray-600 text-white rounded p-2 w-24 text-center focus:border-blue-500 outline-none"
                    />
                    {!gb && ga && (
                        <span className="text-[10px] text-gray-500 mt-1">Precisa de {needInGB.toFixed(1)}</span>
                    )}
                </div>
             </div>

             {/* Grau C */}
             <div className="flex items-center justify-between bg-gray-900 p-3 rounded border border-gray-700">
                <label className="text-white font-medium w-24">Grau C</label>
                <input 
                    type="number" step="0.1" max="10" placeholder="-"
                    value={gc} onChange={e => setGc(e.target.value)}
                    className="bg-gray-800 border border-gray-600 text-white rounded p-2 w-24 text-center focus:border-blue-500 outline-none"
                />
             </div>
          </div>

          {/* RESULTADO DA MÉDIA */}
          <div className={`p-4 rounded-lg border flex justify-between items-center ${isPassing ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'}`}>
            <div>
                <span className="text-sm text-gray-400 block uppercase font-bold">Média Final</span>
                <span className={`text-3xl font-bold ${isPassing ? 'text-green-400' : 'text-red-400'}`}>
                    {finalAverage.toFixed(2)}
                </span>
            </div>
            <div className="text-right">
                {isPassing ? (
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle size={24} />
                        <span className="font-bold">Aprovado</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle size={24} />
                        <span className="font-bold">Reprovado</span>
                    </div>
                )}
                {/* Dica do GC */}
                {!isPassing && !gc && ga && gb && (
                     <p className="text-xs text-yellow-500 mt-1">Faça o Grau C para recuperar!</p>
                )}
            </div>
          </div>

          {/* FALTAS */}
          <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex justify-between">
              <span>Controle de Presença</span>
              <span className={`${absences > maxAbsences ? 'text-red-400' : 'text-green-400'}`}>
                {((absences / maxAbsences) * 100).toFixed(0)}% do limite
              </span>
            </h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setAbsences(Math.max(0, absences - 1))}
                className="w-10 h-10 rounded bg-gray-600 hover:bg-gray-500 text-white font-bold"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold text-white">{absences}</span>
                <span className="text-gray-500 text-sm"> / {maxAbsences} faltas</span>
              </div>
              <button 
                onClick={() => setAbsences(absences + 1)}
                className="w-10 h-10 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                +
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-between items-center bg-gray-800 rounded-b-lg">
             <span className="text-sm text-green-400 font-medium">{feedback}</span>
             <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2 transition disabled:opacity-50"
             >
                <Save size={18} />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
             </button>
        </div>
      </div>
    </div>
  )
}