# 🧬 LiveLife - Personal ERP System

> Uma plataforma unificada para gestão financeira, acadêmica e controle de frota veicular.

![Status](https://img.shields.io/badge/Status-Versão_1.0-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## 🎯 O Problema
A gestão da vida pessoal geralmente é fragmentada: usamos um app para o banco, uma planilha para o carro e o portal da faculdade para as notas. Essa desconexão dificulta a visão geral e a organização.

## 🚀 A Solução
O **LiveLife** centraliza esses três pilares em um dashboard único, permitindo que eventos de áreas diferentes (ex: manutenção do carro) conversem com a agenda pessoal automaticamente.

### Módulos Principais

#### 1. 🚗 Gestão de Veículos (Frota)
Não é apenas um registro de gastos. O sistema possui inteligência para reduzir custos:
* **Calculadora de Eficiência:** Ao abastecer, o sistema calcula qual combustível vale a pena baseado no consumo real do veículo cadastrado.
* **Nível Oficina:** Registro detalhado de manutenções separando custos de peças e mão de obra.
* **Automação:** Registros de manutenção geram lembretes automáticos na Agenda.

#### 2. 💸 Gestão Financeira
* Fluxo de caixa (Entradas e Saídas).
* Categorização inteligente de despesas.
* Visualização clara de saldo.

#### 3. 🎓 Gestão Acadêmica
* Barra de progresso visual do curso de graduação.
* Controle de cadeiras concluídas vs. pendentes.

## 🛠️ Tecnologias Utilizadas

Projeto construído com a versão mais recente do Next.js para máxima performance:

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router)
* **Estilização:** Tailwind CSS (Dark Mode nativo)
* **Banco de Dados & Auth:** [Supabase](https://supabase.com/)
* **Ícones:** Lucide React
* **Deploy:** Vercel

## 🧠 Destaque: Lógica de Abastecimento
O sistema utiliza uma função personalizada para decidir a viabilidade do combustível:
```javascript
// Exemplo simplificado da lógica implementada
const calcularViabilidade = (precoGasolina, precoGNV, rendimentoCarro) => {
  const relacaoPreco = precoGNV / precoGasolina;
  // Lógica baseada na eficiência térmica específica do motor cadastrado
  return relacaoPreco < 0.7 ? "Abasteça com GNV" : "Abasteça com Gasolina";
}
