import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const SYSTEM_PROMPT = `
Você é o FinChat Pro (WhatsApp).
Sua missão é Registrar, Consultar e Editar transações financeiras.

REGRAS:
1. Respostas CURTAS e diretas (estilo chat). Use emojis.
2. Se receber imagem/áudio, extraia os dados e use a ferramenta 'registrar_transacao'.
3. Para consultar/editar, use o ID Numérico (ex: #50).
4. Data padrão: Hoje.
`;

// Função principal que processa Texto ou Mídia
export async function processarMensagemWhatsApp(
    texto: string | null, 
    userId: string, 
    midia?: { tipo: 'image' | 'audio', data: string, mimeType: string }
) {
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Sem chave API");

    // Monta a mensagem para a IA (Multimodal)
    const userContent: any[] = [];
    
    // 1. Se tiver texto, adiciona
    if (texto) userContent.push({ type: 'text', text: texto });
    
    // 2. Se tiver mídia (Imagem ou Áudio), adiciona como anexo para a IA ver/ouvir
    if (midia) {
        userContent.push({
            type: 'image_url', // OpenRouter usa padrão OpenAI, muitas vezes trata audio/imagem via URL ou Base64
            image_url: {
                url: `data:${midia.mimeType};base64,${midia.data}`
            }
        });
        // Se for áudio e não tiver texto, instruímos a transcrever
        if (midia.tipo === 'audio' && !texto) {
             userContent.push({ type: 'text', text: "Ouça este áudio, transcreva o conteúdo e execute a ação financeira solicitada (ex: registrar gasto)." });
        }
        if (midia.tipo === 'image' && !texto) {
            userContent.push({ type: 'text', text: "Analise esta imagem (comprovante/nota), extraia o total, local e data, e registre a transação." });
       }
    }

    // Chamada à IA
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
       method: 'POST',
       headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'FinChat WhatsApp',
       },
       body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp', // Modelo rápido e multimodal (Vision/Audio)
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent }
        ],
        tools: [
          // 1. REGISTRAR
          {
            type: 'function',
            function: {
              name: 'registrar_transacao',
              description: 'Salva nova transação',
              parameters: {
                type: 'object',
                properties: {
                  tipo: { type: 'string', enum: ['despesa', 'receita'] },
                  valor: { type: 'number' },
                  categoria: { type: 'string' },
                  descricao: { type: 'string' },
                  metodo_pagamento: { type: 'string' },
                  data: { type: 'string' }
                },
                required: ['tipo', 'valor', 'categoria']
              }
            }
          },
          // 2. CONSULTAR
          {
            type: 'function',
            function: {
              name: 'consultar_transacao',
              description: 'Busca pelo ID Numérico (ex: 10)',
              parameters: {
                type: 'object',
                properties: {
                  id_numero: { type: 'integer' }
                },
                required: ['id_numero']
              }
            }
          },
          // 3. EDITAR
          {
            type: 'function',
            function: {
              name: 'editar_transacao',
              description: 'Edita pelo ID Numérico',
              parameters: {
                type: 'object',
                properties: {
                  id_numero: { type: 'integer' },
                  valor: { type: 'number' },
                  categoria: { type: 'string' },
                  descricao: { type: 'string' },
                  tipo: { type: 'string', enum: ['despesa', 'receita'] }
                },
                required: ['id_numero']
              }
            }
          }
        ]
       })
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    
    // EXECUÇÃO DAS FERRAMENTAS
    if (message?.tool_calls?.length > 0) {
        const toolCall = message.tool_calls[0];
        const params = JSON.parse(toolCall.function.arguments);
        const funcName = toolCall.function.name;

        if (funcName === 'registrar_transacao') {
            if (params.categoria) params.categoria = params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1);
            if (!params.metodo_pagamento) params.metodo_pagamento = 'WhatsApp';

            const { data: inserido, error } = await supabaseAdmin.from('transacoes').insert({
                tipo: params.tipo,
                valor: params.valor,
                categoria: params.categoria,
                descricao: params.descricao || 'Via WhatsApp',
                metodo_pagamento: params.metodo_pagamento,
                data: params.data || new Date().toISOString(),
                usuario_id: userId
            }).select().single();

            if (error) return `❌ Erro: ${error.message}`;
            return `✅ *Registrado!* (#${inserido.id_curto})\n💰 R$ ${inserido.valor}\n📂 ${inserido.categoria}\n📝 ${inserido.descricao}`;
        }

        if (funcName === 'consultar_transacao') {
            const { data: item } = await supabaseAdmin.from('transacoes')
                .select('*').eq('id_curto', params.id_numero).eq('usuario_id', userId).single();
            
            if (!item) return `⚠️ Transação #${params.id_numero} não encontrada.`;
            return `🔍 *Detalhes # ${item.id_curto}*\n💰 R$ ${item.valor}\n📂 ${item.categoria}\n📝 ${item.descricao}\n📅 ${new Date(item.data).toLocaleDateString('pt-BR')}`;
        }

        if (funcName === 'editar_transacao') {
            const id = params.id_numero;
            delete params.id_numero;
            const { data: atualizado, error } = await supabaseAdmin.from('transacoes')
                .update(params).eq('id_curto', id).eq('usuario_id', userId).select().single();

            if (error || !atualizado) return `❌ Erro ao editar #${id}.`;
            return `✏️ *Atualizado # ${atualizado.id_curto}*\n💰 Novo Valor: R$ ${atualizado.valor}`;
        }
    }

    return message?.content || "Desculpe, não entendi.";

  } catch (error: any) {
    console.error("Erro Service:", error);
    return "❌ Erro interno no processamento.";
  }
}