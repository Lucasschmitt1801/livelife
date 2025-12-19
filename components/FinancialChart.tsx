'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts'

interface Transaction {
  amount: number
}

interface FinancialChartProps {
  transactions: Transaction[]
}

export default function FinancialChart({ transactions }: FinancialChartProps) {
  // 1. Processar os dados para o gráfico
  const summary = transactions.reduce(
    (acc, t) => {
      if (t.amount > 0) {
        acc.income += t.amount
      } else {
        acc.expense += Math.abs(t.amount)
      }
      return acc
    },
    { income: 0, expense: 0 }
  )

  const data = [
    { name: 'Entradas', value: summary.income, color: '#22c55e' }, // Verde
    { name: 'Saídas', value: summary.expense, color: '#ef4444' }, // Vermelho
  ]

  if (summary.income === 0 && summary.expense === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm border border-gray-700 rounded-lg bg-gray-800">
        Sem dados suficientes para gerar gráfico.
      </div>
    )
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-200 mb-6">Resumo Financeiro</h3>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              stroke="#9ca3af" 
              width={70}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              // CORREÇÃO: Usamos 'any' para evitar erro de build na Vercel
              formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-6 mt-4 text-sm font-medium">
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Entradas: R$ {summary.income.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 text-red-400">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Saídas: R$ {summary.expense.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}