'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { CheckCircle2, Circle, Clock, BookOpen, Settings } from 'lucide-react'
import SubjectDetailsModal from './SubjectDetailsModal' // Importar o novo modal

interface AcademicModuleProps {
  session: any
}

interface Subject {
  id: string
  name: string
  semester: number
  status: 'pending' | 'in_progress' | 'completed'
  is_optional: boolean
}

export default function AcademicModule({ session }: AcademicModuleProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null) // Para o modal

  async function fetchSubjects() {
    const { data } = await supabase
      .from('academic_subjects')
      .select('*')
      .order('semester', { ascending: true })
      .order('name', { ascending: true })
    
    if (data) setSubjects(data)
  }

  async function toggleStatus(id: string, currentStatus: string) {
    let newStatus = 'pending'
    if (currentStatus === 'pending') newStatus = 'in_progress'
    else if (currentStatus === 'in_progress') newStatus = 'completed'
    else if (currentStatus === 'completed') newStatus = 'pending'

    setSubjects(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s))

    const { error } = await supabase.rpc('update_subject_status', { 
        p_subject_id: id, 
        p_status: newStatus 
    })
    if (error) fetchSubjects()
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const subjectsBySemester = subjects.reduce((acc, subject) => {
    const sem = subject.semester || 0
    if (!acc[sem]) acc[sem] = []
    acc[sem].push(subject)
    return acc
  }, {} as Record<number, Subject[]>)

  const total = subjects.length
  const completed = subjects.filter(s => s.status === 'completed').length
  const progress = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-green-900 p-6 rounded-lg shadow-lg border border-emerald-700/50">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-emerald-400" /> Engenharia da Computação
                </h2>
                <p className="text-emerald-200 text-sm mt-1">Progresso do Curso</p>
            </div>
            <div className="text-right">
                <span className="text-3xl font-bold text-white">{progress.toFixed(0)}%</span>
                <p className="text-xs text-emerald-300">{completed} de {total} cadeiras</p>
            </div>
        </div>
        <div className="w-full bg-black/30 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Grade */}
      <div className="space-y-6">
        {Object.keys(subjectsBySemester).map((semester) => (
            <div key={semester} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="bg-gray-750 px-6 py-3 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-200">{semester}º Semestre</h3>
                    <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                        {subjectsBySemester[parseInt(semester)].filter(s => s.status === 'completed').length} / {subjectsBySemester[parseInt(semester)].length}
                    </span>
                </div>
                
                <div className="divide-y divide-gray-700">
                    {subjectsBySemester[parseInt(semester)].map(subject => (
                        <div key={subject.id} className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition group">
                            
                            {/* Área clicável para mudar status */}
                            <div 
                                onClick={() => toggleStatus(subject.id, subject.status)}
                                className="flex items-center gap-4 cursor-pointer flex-1"
                            >
                                <div className="min-w-[24px]">
                                    {subject.status === 'completed' && <CheckCircle2 className="text-green-500" />}
                                    {subject.status === 'in_progress' && <Clock className="text-blue-400" />}
                                    {subject.status === 'pending' && <Circle className="text-gray-600 group-hover:text-gray-400" />}
                                </div>
                                
                                <div>
                                    <p className={`font-medium transition ${subject.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                                        {subject.name}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        {subject.is_optional && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-800">Opcional</span>}
                                        {subject.status === 'in_progress' && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-800">Cursando</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Botão de Detalhes (Só aparece se estiver cursando ou concluído) */}
                            {(subject.status === 'in_progress' || subject.status === 'completed') && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedSubject(subject); }}
                                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-600 rounded transition"
                                    title="Gerenciar Notas e Faltas"
                                >
                                    <Settings size={18} />
                                </button>
                            )}

                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {selectedSubject && (
        <SubjectDetailsModal 
            isOpen={!!selectedSubject} 
            onClose={() => setSelectedSubject(null)} 
            subject={selectedSubject} 
        />
      )}
    </div>
  )
}