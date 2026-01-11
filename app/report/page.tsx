'use client'

import { Mermaid } from '@/components/Mermaid'

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Sistema de Gestão Financeira
          </h1>
          <p className="text-xl sm:text-2xl opacity-90">
            Registre suas despesas e receitas falando com seu celular
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Resumo Executivo */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            📋 O que o sistema faz?
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            Um sistema que permite <strong>registrar despesas e receitas usando o Telegram (ou WhatsApp)</strong> — como se você estivesse falando com um contador.
            O bot entende o que você diz, salva automaticamente e envia relatórios diários de como está o seu negócio.
          </p>

          {/* Cartões de benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <div className="text-4xl mb-3">⏱️</div>
              <div className="text-emerald-900 dark:text-emerald-100 font-semibold mb-2">Economize Tempo</div>
              <div className="text-emerald-700 dark:text-emerald-300 text-sm">
                Registre gastos em 10 segundos falando com o bot
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div className="text-4xl mb-3">🎯</div>
              <div className="text-blue-900 dark:text-blue-100 font-semibold mb-2">Automático</div>
              <div className="text-blue-700 dark:text-blue-300 text-sm">
                O bot categoriza e organiza tudo para você
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-purple-900 dark:text-purple-100 font-semibold mb-2">Sempre Visível</div>
              <div className="text-purple-700 dark:text-purple-300 text-sm">
                Dashboard com seus números atualizados 24/7
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            💬 Como usar?
          </h2>

          <div className="space-y-6">
            {/* Exemplo 1: Registrar despesa */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                1️⃣ Fale com o bot
              </h3>
              <div className="bg-white dark:bg-gray-600 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                <p className="text-gray-800 dark:text-gray-200 font-mono">
                  Você: "Gastei 500 reais em gasolina para a caminhonete"
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 border-l-4 border-emerald-500">
                <p className="text-gray-800 dark:text-gray-200 mb-2">✅ Despesa registrada</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💰 Valor: R$ 500,00<br/>
                  📁 Categoria: Combustível<br/>
                  📝 Descrição: Abastecimento caminhonete<br/>
                  <br/>
                  <strong>Saldo do dia: R$ 8.600,00</strong>
                </p>
              </div>
            </div>

            {/* Exemplo 2: Registrar receita */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                2️⃣ Também funciona para receitas
              </h3>
              <div className="bg-white dark:bg-gray-600 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                <p className="text-gray-800 dark:text-gray-200 font-mono">
                  Você: "Vendi um serviço para 10 pessoas por 8.500 reais, pagaram no cartão"
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 border-l-4 border-emerald-500">
                <p className="text-gray-800 dark:text-gray-200 mb-2">✅ Receita registrada</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💵 Valor: R$ 8.500,00<br/>
                  🏖️ Categoria: Vendas<br/>
                  👥 Pessoas: 10<br/>
                  💳 Método: Cartão de Crédito<br/>
                  <br/>
                  <strong>Saldo do dia: R$ 17.100,00</strong>
                </p>
              </div>
            </div>

            {/* Exemplo 3: Consultar */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                3️⃣ Pergunte qualquer coisa
              </h3>
              <div className="bg-white dark:bg-gray-600 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                <p className="text-gray-800 dark:text-gray-200 font-mono">
                  Você: "Quanto eu gastei hoje?"
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-gray-800 dark:text-gray-200 text-sm">
                  Hoje você gastou R$ 2.150,00:<br/>
                  • ⛽ Combustível: R$ 500<br/>
                  • 🛒 Compras: R$ 1.200<br/>
                  • 💰 Comissões: R$ 450<br/>
                  <br/>
                  Seu saldo do dia é <strong>R$ 6.350,00</strong> ✅
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Diagrama Simples */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            🔄 Fluxo do Sistema
          </h2>

          <Mermaid chart={`
graph LR
    A[👤 Você fala<br/>com o bot] --> B[🤖 Bot entende<br/>com IA]
    B --> C[💾 Salva<br/>automaticamente]
    C --> D[📊 Você vê no<br/>dashboard]

    style A fill:#10b981
    style B fill:#3b82f6
    style C fill:#8b5cf6
    style D fill:#f59e0b
          `} />

          <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Você pode enviar:
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-3">💬</span>
                <span><strong>Texto:</strong> "Gastei 500 em gasolina"</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">🎤</span>
                <span><strong>Voz:</strong> Fale e o bot entende</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">📸</span>
                <span><strong>Foto:</strong> Tire foto do comprovante e o bot salva</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Relatório Diário */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            📨 Relatório Diário Automático
          </h2>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Todo dia às <strong>18:00</strong>, o bot envia um resumo automático:
          </p>

          <div className="bg-gray-900 text-green-400 rounded-xl p-6 font-mono text-sm overflow-x-auto">
            <pre>{`📊 RELATÓRIO DIÁRIO - 05 de Outubro 2025

💵 RECEITAS: R$ 12.500,00
   🏖️ Vendas: R$ 10.500 (13 clientes)
   🍽️ Restaurante: R$ 2.000

💸 DESPESAS: R$ 3.400,00
   ⛽ Combustível: R$ 500
   🛒 Compras: R$ 1.200
   💰 Comissões: R$ 1.700

💰 SALDO LÍQUIDO: R$ 9.100,00 ✅

📈 ESTATÍSTICAS:
   👥 13 clientes
   💵 Ticket Médio: R$ 808,00
   💳 Dinheiro: R$ 2.100 (17%)
   🏦 Cartão/Pix: R$ 10.400 (83%)

🔗 Ver dashboard: seu-app.vercel.app`}</pre>
          </div>
        </section>

        {/* Dashboard */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            💻 Dashboard Web
          </h2>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Acesse de qualquer computador ou celular para ver seus números em tempo real:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800">
              <div className="text-sm text-green-700 dark:text-green-300 mb-1">Receitas (Mês)</div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">R$ 245.000</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-6 rounded-xl border-2 border-red-200 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-300 mb-1">Despesas (Mês)</div>
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">R$ 180.000</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Saldo Líquido</div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">R$ 65.000</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">Transações</div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">287</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Inclui:
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-3">📊</span>
                <span>Gráficos de tendência (últimos 30 dias)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">📋</span>
                <span>Tabela completa de todas as transações</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">🔍</span>
                <span>Filtros por data, categoria e tipo</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">📸</span>
                <span>Visualização das fotos/comprovantes salvos</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3">🌙</span>
                <span>Modo claro/escuro</span>
              </li>
            </ul>
          </div>
        </section>

        {/* O que foi construído */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            ✅ Funcionalidades Prontas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-xl border-l-4 border-emerald-500">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Bot Inteligente</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Registra despesas e receitas falando, digitando ou enviando fotos
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-l-4 border-blue-500">
              <div className="text-2xl mb-2">💻</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Dashboard Web</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Indicadores em tempo real, gráficos e tabelas completas
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-xl border-l-4 border-purple-500">
              <div className="text-2xl mb-2">📨</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Relatórios Automáticos</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Relatório diário automático com resumo completo
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl border-l-4 border-amber-500">
              <div className="text-2xl mb-2">💾</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Banco de Dados Seguro</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Seus dados salvos na nuvem com segurança (Supabase)
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 p-6 rounded-xl border-l-4 border-pink-500">
              <div className="text-2xl mb-2">📸</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Armazenamento</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Guarda fotos de faturas e recibos automaticamente
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-l-4 border-teal-500">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Multi-dispositivo</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Funciona no computador, tablet e celular
              </p>
            </div>
          </div>
        </section>

        {/* Como Funciona Por Dentro */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            🔧 Como funciona por dentro
          </h2>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            O sistema é construído com <strong>fluxos de trabalho automáticos</strong>. Aqui explicamos o que cada peça faz:
          </p>

          {/* Workflow 1: Agente IA */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
              🤖 Agente IA (O Cérebro)
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Este é o fluxo principal. Quando você interage com o sistema:
            </p>

            <Mermaid chart={`
graph TD
    A[📱 Recebe mensagem] --> B{Que tipo<br/>de mensagem?}

    B -->|📸 Foto| C[Salvar foto<br/>no armazenamento]
    B -->|💬 Texto| D[Ler sua mensagem]
    B -->|🎤 Voz| E[Converter voz<br/>para texto]

    C --> F[Entender o que<br/>você quer]
    E --> D
    D --> F

    F --> G{Intenção}

    G -->|💸 Registrar Despesa| H[Salvar no<br/>banco de dados]
    G -->|💵 Registrar Receita| H
    G -->|❓ Consultar Dados| I[Buscar no<br/>banco de dados]

    H --> K[Calcular<br/>saldo do dia]
    I --> L[Responder com<br/>os dados]

    K --> M[📨 Enviar<br/>resposta]
    L --> M

    style A fill:#4CAF50,color:#fff
    style F fill:#9C27B0,color:#fff
    style H fill:#2196F3,color:#fff
    style M fill:#8BC34A,color:#fff
            `} />
          </div>

          {/* Base de Dados */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              💾 Onde seus dados ficam?
            </h3>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Tudo é salvo de forma organizada em tabelas seguras no <strong>Supabase</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="text-3xl mb-3">📊</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">transacoes</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Tabela principal onde fica cada despesa e receita.
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Data e hora</li>
                  <li>• Tipo (despesa/receita)</li>
                  <li>• Valor e categoria</li>
                  <li>• Descrição</li>
                  <li>• Método de pagamento</li>
                  <li>• Link da foto (se houver)</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                <div className="text-3xl mb-3">🏷️</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">categorias</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Categorias para organizar suas finanças.
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li><strong>Despesas:</strong></li>
                  <li>Alimentação, Transporte, Moradia, etc.</li>
                  <li className="pt-2"><strong>Receitas:</strong></li>
                  <li>Salário, Vendas, Investimentos, etc.</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                <div className="text-3xl mb-3">📈</div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">gastos_mensais</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Controle de assinaturas e gastos recorrentes.
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Nome (Netflix, Aluguel)</li>
                  <li>• Dia de cobrança</li>
                  <li>• Valor fixo</li>
                  <li>• Status (Ativo/Inativo)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center text-gray-600 dark:text-gray-400 py-8">
          <p className="mb-2">Sistema Financeiro Inteligente</p>
          <p className="text-sm">© {new Date().getFullYear()} · Todos os direitos reservados</p>
        </section>

      </div>
    </div>
  )
}