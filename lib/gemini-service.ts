import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function processarMensagemWhatsApp(
    texto: string | null, 
    userId: string, 
    midia?: { tipo: 'image' | 'audio', data: string, mimeType: string }
) {
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Sem chave API");

    const hoje = new Date();
    const dataAtual = hoje.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const anoAtual = hoje.getFullYear();

    // 1. BUSCAR A MEMÓRIA DO USUÁRIO
    const { data: usuarioDb } = await supabaseAdmin
        .from('usuarios_whatsapp')
        .select('historico_mensagens')
        .eq('user_id', userId)
        .single();

    let historico = usuarioDb?.historico_mensagens || [];
    if (!Array.isArray(historico)) historico = [];

    // 🧠 O CÉREBRO DEFINITIVO: Autônomo para gastos, mas amigável para dúvidas
    const SYSTEM_PROMPT = `
Você é o FinChat Pro, um assistente financeiro de WhatsApp inteligente e proativo.

CATÁLOGO PADRÃO DE CATEGORIAS E SUBCATEGORIAS:
- Renda: Salário, Renda de Juros, Dividendos, Dinheiro Inesperado, Reembolsos, Transferência de Poupança, Renda extra, Outros
- Moradia: Aluguel/Parcelas do Imóvel, IPTU, Conta de Luz, Gás, Conta de Água, Telefone, Tv a Cabo, Internet, Eletrodomésticos, Faxina, Manutenção, Melhorias, Outros
- Transporte: Parcelamento do Carro, Seguro do Carro, Combustível, Ônibus/Táxi, Reparos, Outros
- Saude: Seguro de Vida, Consulta, Dentista, Medicamentos, Rotina saúdavel, Veterinário, Outros
- Doacoes/Presentes: Presentes, Doações para Caridade, Doações Religiosas, Outros
- Assinaturas: Streaming, Revistas, Nuvem, Outros
- Vida Diaria: Supermercado, Suprimentos Pessoais, Roupas, Produtos de Limpeza, Educação, Jantar/Comer Fora, Salão de Beleza, Bebidas, Outros
- Entretenimento: Filmes/Cinema, Música, Games, Shows, Livros, Hobbies, Fotografia, Esportes, Passeios, Loteria, Férias, Viagem, Teatro, Outros
- Economias: Fundo de Emergência, Transferência de Poupança, Investimentos, Educação, Outros
- Obrigacoes: Dívidas, Empréstimo estudantil, Outro empréstimo, Cartões de crédito, Taxas e Impostos, Outros

REGRAS DE OURO (OBEDEÇA RIGOROSAMENTE):
1. PARA GASTOS (ZERO PERGUNTAS): Se a mensagem ou áudio relatar uma compra ou recebimento, NUNCA faça perguntas. Extraia o valor, deduza a categoria e a descrição sozinho e chame IMEDIATAMENTE a ferramenta 'registrar_transacao'. 
2. PARA LISTAR CATEGORIAS: Se o usuário pedir para ver as categorias, não use ferramentas. Responda em formato de texto listando as categorias e subcategorias de forma amigável.
3. PARA ALTERAR/APAGAR: Se o usuário pedir para apagar ou alterar, use as ferramentas 'apagar_transacao' ou 'editar_transacao' passando o ID (que ele deve fornecer).
4. PARA RELATÓRIOS: Se ele pedir um resumo, use a ferramenta 'gerar_relatorio'.
5. DATAS: Hoje é ${dataAtual}. Formato para as ferramentas: YYYY-MM-DD.
`;

    const userContent: any[] = [];

    if (texto) {
      userContent.push({ type: 'text', text: texto });
    } else if (midia && midia.tipo === 'audio') {
      userContent.push({ type: 'text', text: 'MÍDIA RECEBIDA: Ouça o áudio, deduza o gasto e acione a ferramenta registrar_transacao sem fazer nenhuma pergunta.' });
    } else if (midia && midia.tipo === 'image') {
      userContent.push({ type: 'text', text: 'MÍDIA RECEBIDA: Leia o recibo/imagem, deduza o valor e a categoria e acione a ferramenta registrar_transacao sem fazer perguntas.' });
    }

    if (midia && midia.data) {
      const dataUri = `data:${midia.mimeType};base64,${midia.data}`;
      userContent.push({ type: 'image_url', image_url: { url: dataUri } });
    }

    const mensagensParaIA = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historico, 
      { role: "user", content: userContent }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", 
        messages: mensagensParaIA,
        tools: [
          {
            type: 'function',
            function: {
              name: 'registrar_transacao',
              description: 'Salva uma nova transação financeira no banco de dados',
              parameters: {
                type: 'object',
                properties: {
                  tipo: { type: 'string', enum: ['despesa', 'receita'] },
                  valor: { type: 'number' },
                  categoria: { type: 'string' },
                  subcategoria: { type: 'string' },
                  descricao: { type: 'string' },
                  metodo_pagamento: { type: 'string' },
                  data: { type: 'string' }
                },
                required: ['tipo', 'valor', 'categoria', 'subcategoria', 'descricao']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'editar_transacao',
              description: 'Altera os dados de uma transação usando o ID',
              parameters: {
                type: 'object',
                properties: {
                  id_numero: { type: 'integer' },
                  valor: { type: 'number' },
                  categoria: { type: 'string' },
                  subcategoria: { type: 'string' },
                  descricao: { type: 'string' }
                },
                required: ['id_numero']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'apagar_transacao',
              description: 'Exclui permanentemente uma transação pelo ID',
              parameters: {
                type: 'object',
                properties: {
                  id_numero: { type: 'integer' }
                },
                required: ['id_numero']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'gerar_relatorio',
              description: 'Gera relatório de gastos por período e envia o link do painel',
              parameters: {
                type: 'object',
                properties: {
                  periodo: { type: 'string', enum: ['hoje', 'semana', 'mes', 'sempre'] }
                },
                required: ['periodo']
              }
            }
          }
        ]
       })
    });

    const data = await response.json();
    if (data.error) return `❌ Erro na IA: ${data.error.message}`;

    const message = data.choices?.[0]?.message;
    let respostaFinal = "Desculpe, não consegui processar o pedido. Tente novamente.";
    
    if (message?.tool_calls?.length > 0) {
        const toolCall = message.tool_calls[0];
        const params = JSON.parse(toolCall.function.arguments);
        const funcName = toolCall.function.name;

        // 1. REGISTRAR TRANSAÇÃO
        if (funcName === 'registrar_transacao') {
            let dataFinal = new Date().toISOString();
            if (params.data) dataFinal = params.data.includes('T') ? params.data : `${params.data}T12:00:00-03:00`;

            const catFormatada = params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1);

            const { data: inserido, error } = await supabaseAdmin.from('transacoes').insert({
                tipo: params.tipo,
                valor: params.valor,
                categoria: catFormatada,
                subcategoria: params.subcategoria.charAt(0).toUpperCase() + params.subcategoria.slice(1),
                descricao: params.descricao,
                metodo_pagamento: params.metodo_pagamento || 'WhatsApp',
                data: dataFinal,
                usuario_id: userId
            }).select().single();

            if (error) {
                respostaFinal = `❌ Erro ao salvar: ${error.message}`;
            } else {
                const dataFmt = new Date(inserido.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                
                respostaFinal = `✅ *Transação Registrada*\n\n🆔 ID: ${inserido.id_curto}\n💰 VALOR: R$ ${inserido.valor.toFixed(2)}\n📂 CATEGORIA: ${inserido.categoria}\n🏷️ SUBCATEGORIA: ${inserido.subcategoria}\n📝 DESCRICAO: ${inserido.descricao}\n📅 DATA: ${dataFmt}`;

                // 🚨 VERIFICAÇÃO DA META (Se for despesa)
                if (inserido.tipo === 'despesa') {
                    try {
                        const { data: meta } = await supabaseAdmin.from('metas_gastos').select('valor_limite').eq('usuario_id', userId).eq('categoria', catFormatada).single();
                        
                        if (meta) {
                            const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
                            const { data: gastos } = await supabaseAdmin.from('transacoes').select('valor').eq('usuario_id', userId).eq('categoria', catFormatada).eq('tipo', 'despesa').gte('data', mesAtual);
                            
                            const totalGasto = gastos?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;

                            if (totalGasto > meta.valor_limite) {
                                respostaFinal += `\n\n🚨 *ALERTA DE META ESTOURADA!*\nVocê definiu um limite de R$ ${meta.valor_limite.toFixed(2)} para ${catFormatada}, mas já gastou R$ ${totalGasto.toFixed(2)} neste mês.`;
                            } else if (totalGasto >= meta.valor_limite * 0.8) {
                                respostaFinal += `\n\n⚠️ *AVISO DE META!*\nVocê já gastou R$ ${totalGasto.toFixed(2)} e está muito perto do limite de R$ ${meta.valor_limite.toFixed(2)} para ${catFormatada}.`;
                            }
                        }
                    } catch (e) {
                        // Se não houver meta, a query falha silenciosamente e não estraga a resposta.
                    }
                }
            }
        } 
        
        // 2. EDITAR TRANSAÇÃO
        else if (funcName === 'editar_transacao') {
            const atualizacoes: any = {};
            if (params.valor) atualizacoes.valor = params.valor;
            if (params.categoria) atualizacoes.categoria = params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1);
            if (params.subcategoria) atualizacoes.subcategoria = params.subcategoria.charAt(0).toUpperCase() + params.subcategoria.slice(1);
            if (params.descricao) atualizacoes.descricao = params.descricao;

            const { data: editado, error } = await supabaseAdmin.from('transacoes').update(atualizacoes).eq('id_curto', params.id_numero).eq('usuario_id', userId).select().single();

            if (error || !editado) {
                respostaFinal = `❌ Erro: Não encontrei a transação de ID #${params.id_numero}.`;
            } else {
                const dataFmt = new Date(editado.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                respostaFinal = `✏️ *Transação Alterada*\n\n🆔 ID: ${editado.id_curto}\n💰 VALOR: R$ ${editado.valor.toFixed(2)}\n📂 CATEGORIA: ${editado.categoria}\n🏷️ SUBCATEGORIA: ${editado.subcategoria}\n📝 DESCRICAO: ${editado.descricao}\n📅 DATA: ${dataFmt}`;
            }
        }

        // 3. APAGAR TRANSAÇÃO
        else if (funcName === 'apagar_transacao') {
            const { error, count } = await supabaseAdmin.from('transacoes').delete({ count: 'exact' }).eq('id_curto', params.id_numero).eq('usuario_id', userId);
            
            if (error || count === 0) {
                 respostaFinal = `❌ Erro: Não encontrei a transação de ID #${params.id_numero} para apagar.`;
            } else {
                 respostaFinal = `🗑️ *Transação Apagada!*\nA transação ID #${params.id_numero} foi removida permanentemente do seu sistema.`;
            }
        }

        // 4. RELATÓRIO
        else if (funcName === 'gerar_relatorio') {
            respostaFinal = `📊 *Seu Relatório Solicitado*\n\nPara ver análises detalhadas, gráficos e aplicar filtros precisos, acesse o seu Painel de Controle:\n🔗 https://sisfin.vercel.app/dashboard`;
        }
        
    } else {
        // Se ela não usou ferramentas (ex: o usuário pediu para listar as categorias)
        respostaFinal = message?.content || "Desculpe, não consegui processar.";
    }

    // 🧠 Salvar na Memória (Últimas 6 mensagens)
    historico.push({ role: "user", content: texto || "[Mídia Enviada]" });
    historico.push({ role: "assistant", content: respostaFinal });
    if (historico.length > 6) historico = historico.slice(historico.length - 6);

    await supabaseAdmin.from('usuarios_whatsapp').update({ historico_mensagens: historico }).eq('user_id', userId);

    return respostaFinal;

  } catch (error: any) {
    return "❌ Erro interno no processamento.";
  }
}