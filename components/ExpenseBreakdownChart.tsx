'use client'

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'

interface Transaction {
  amount: number
  financial_categories?: {
    name: string
    icon: string
  }
}

interface ExpenseBreakdownChartProps {
  transactions: Transaction[]
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b']

export default function ExpenseBreakdownChart({ transactions }: ExpenseBreakdownChartProps) {
  
  // 1. Processar dados: Agrupar despesas por categoria
  const dataMap = transactions
    .filter(t => t.amount < 0) // Só queremos despesas
    .reduce((acc, t) => {
      const categoryName = t.financial_categories?.name || 'Outros'
      const value = Math.abs(t.amount) // Valor positivo para o gráfico

      if (!acc[categoryName]) {
        acc[categoryName] = 0
      }
      acc[categoryName] += value
      return acc
    }, {} as Record<string, number>)

  // 2. Transformar em array para o Recharts
  const data = Object.keys(dataMap).map((name, index) => ({
    name,
    value: dataMap[name],
    color: COLORS[index % COLORS.length] // Cicla as cores se tiver muitas categorias
  })).sort((a, b) => b.value - a.value) // Ordena do maior para o menor

  // Se não tiver despesas, mostra aviso
  if (data.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 h-80 flex flex-col items-center justify-center text-gray-500">
        <p>Sem despesas registradas.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-200 mb-2">Despesas por Categoria</h3>
      
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}