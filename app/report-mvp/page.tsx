'use client'

import Link from 'next/link'
import { CheckCircle2, Sparkles, Zap, TrendingUp, FileText, Upload, Camera, Brain } from 'lucide-react'

export default function ReportMVPPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <Sparkles className="w-6 h-6" />
              <span className="font-semibold">MVP Concluído</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
            Sistema de Gestão Financeira<br/>
            <span className="text-emerald-200">Profissional</span>
          </h1>

          <p className="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            Dashboard completo para registrar, visualizar e analisar todas as despesas e receitas do seu negócio
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* Resumo Executivo */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-12 border-t-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              ✅ Sistema 100% Funcional
            </h2>
          </div>

          <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
            Seu sistema financeiro está <strong>completamente operacional</strong>. Você pode começar a usá-lo hoje mesmo
            para registrar transações, visualizar relatórios e tomar decisões informadas sobre seu negócio.
          </p>

          <div className="flex justify-center gap-6 flex-wrap">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-8 rounded-xl text-center border-2 border-emerald-200 dark:border-emerald-800 max-w-sm flex-1">
              <div className="text-6xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">8</div>
              <div className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Funcionalidades<br/>Principais</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-8 rounded-xl text-center border-2 border-yellow-200 dark:border-yellow-800 max-w-sm flex-1">
              <div className="text-6xl font-bold text-yellow-600 dark:text-yellow-400 mb-3">+11</div>
              <div className="text-gray-700 dark:text-gray-300 font-semibold text-lg">Bônus<br/>Incluídos</div>
            </div>
          </div>
        </section>

        {/* Roadmap de Funcionalidades */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 Roadmap de Implementação
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Tudo o que foi construído para o seu sistema financeiro
            </p>
          </div>

          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-emerald-500 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Principal</h3>
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Painel de controle com KPIs em tempo real mostrando receitas, despesas, saldo líquido e total de transações.
                    Inclui gráficos de tendência dos últimos 30 dias e visualizações por dia, semana e mês.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      📊 Gráficos interativos
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      📈 Tendências visuais
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🌙 Modo escuro
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-blue-500 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Registro Manual de Transações</h3>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Formulário completo para registrar despesas e receitas manualmente. Suporta categorias predefinidas,
                    métodos de pagamento e upload de comprovantes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      ✏️ Formulário completo
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🏷️ Categorias Personalizadas
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      👥 Controle de usuário
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-purple-500 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Fechamento de Caixa Diário</h3>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Sistema de conferência rápida para o caixa do dia. Permite comparar o que está registrado no sistema
                    com o dinheiro físico/banco real, calculando diferenças automaticamente.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      ⚡ Conferência Rápida
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      💵 Controle de Quebra
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🧮 Cálculos automáticos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 - NEW */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-cyan-500 hover:shadow-2xl transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                NOVO
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-lg">
                  <Upload className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Importação Excel/CSV</h3>
                    <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Importe múltiplas transações de arquivos Excel ou CSV. Inclui validação automática de dados,
                    suporte a arrastar e soltar (drag & drop) e relatório de sucesso/erro.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      📄 Compatível com Excel
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      ✅ Validação Automática
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      📊 Importação em Lote
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5 - NEW */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-pink-500 hover:shadow-2xl transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                MELHORADO
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-lg">
                  <Camera className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">OCR com IA (GPT-4 Vision)</h3>
                    <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Envie fotos de comprovantes ou notas fiscais e o sistema extrai automaticamente: valor, estabelecimento,
                    categoria sugerida e data. Suporta envio múltiplo e colar direto da área de transferência (Ctrl+V).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🤖 Leitura Inteligente
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      📸 Auto-extração
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🏷️ Categorização IA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 6 - NEW */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-amber-500 hover:shadow-2xl transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                NOVO
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
                  <Brain className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Verificação Inteligente de Valores</h3>
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Ao registrar um gasto com foto, o sistema compara o valor que você digitou com o do comprovante.
                    Se houver diferença maior que R$ 50,00, ele alerta e pergunta qual é o correto antes de salvar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🔍 Comparação Auto
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      ⚠️ Alertas de Erro
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      ✅ Segurança
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 7 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-indigo-500 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                  <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Agente IA Conversacional</h3>
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Chat inteligente que entende português natural. Registre despesas e receitas apenas conversando,
                    com respostas em tempo real (streaming) e salvamento automático no banco de dados.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      💬 Linguagem Natural
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🌊 Streaming SSE
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🧠 IA Avançada
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 8 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border-l-4 border-teal-500 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Visualização de Dados</h3>
                    <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold px-3 py-1 rounded-full">
                      IMPLEMENTADO
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    Filtre transações por dia, semana, mês ou período personalizado. Tabelas com cores diferenciadas
                    (verde para receitas, vermelho para despesas) e totais automáticos.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      📅 Filtros de Data
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      🎨 Visual Intuitivo
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded">
                      📊 Agrupamento
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bonus Features */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            🎁 Bônus Incluídos
          </h2>

          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            11 funcionalidades adicionais que foram agregadas ao projeto
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-6 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">✨ Modo Escuro (Dark Mode)</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                O sistema adapta-se automaticamente à preferência do seu dispositivo ou permite troca manual
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">📊 Paginação Avançada</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Navegue facilmente entre 50, 100 ou 500 transações por página
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">🌊 Streaming em Tempo Real</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Experiência de chat fluida, com respostas aparecendo palavra por palavra
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">🚀 Tecnologias 2025</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Construído com Next.js 15, React 19 e Tailwind v4 para máxima performance
              </p>
            </div>
          </div>
        </section>

        {/* Stack Tecnológico */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 sm:p-12 text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
            🔧 Stack Tecnológico
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-emerald-400 font-bold mb-2">Frontend</div>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Next.js 15.5 (App Router)</li>
                <li>• React 19 + TypeScript</li>
                <li>• Tailwind CSS v4</li>
                <li>• Recharts (Gráficos)</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-blue-400 font-bold mb-2">Backend & Dados</div>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Next.js API Routes</li>
                <li>• Supabase (PostgreSQL)</li>
                <li>• Supabase Storage</li>
                <li>• Server-Sent Events (SSE)</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-purple-400 font-bold mb-2">IA & Serviços</div>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• OpenRouter API</li>
                <li>• Google Gemini 2.0 Flash</li>
                <li>• Visão Computacional (OCR)</li>
                <li>• Function Calling</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Como Empezar */}
        <section className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 text-white rounded-2xl shadow-2xl p-8 sm:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
            🎯 Como Começar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center text-lg">1</span>
                Acesse o Dashboard
              </h3>
              <p className="text-emerald-100 mb-4">
                Abra seu navegador e veja seus números agora:
              </p>
              <Link
                href="/"
                className="block bg-white text-emerald-600 px-6 py-3 rounded-lg font-bold text-center hover:bg-emerald-50 transition-colors"
              >
                Ir para o Dashboard →
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-lg">2</span>
                Explore as Ferramentas
              </h3>
              <p className="text-blue-100 mb-4">
                Navegue pelo menu superior para:
              </p>
              <ul className="space-y-2 text-cyan-100">
                <li>• 📊 Dashboard - KPIs e Gráficos</li>
                <li>• ✏️ Registro - Lançamentos Manuais</li>
                <li>• 📅 Fechamento - Controle Diário</li>
                <li>• 📄 Importar Excel - Dados em Lote</li>
                <li>• 🤖 Agente IA - Chat Inteligente</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <p className="text-lg mb-4">
              Dúvidas sobre o funcionamento?
            </p>
            <Link
              href="/report"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
            >
              Ver Documentação Técnica Completa →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center text-gray-600 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-lg mb-2">
            Sistema Financeiro Profissional
          </p>
          <p className="text-sm">
            MVP Concluído e Funcional · {new Date().getFullYear()}
          </p>
        </section>
      </div>
    </div>
  )
}