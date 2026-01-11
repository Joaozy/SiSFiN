import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com permissão ADMIN (Service Role) para atuar pelo WhatsApp
// OBS: Você precisará pegar a chave 'service_role' no painel do Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const SYSTEM_PROMPT = `
Você é o FinChat Pro (Versão WhatsApp).
Sua missão é Registrar, Consultar e Editar transações.
Responda de forma curta e direta, adequada para chat de celular.

REGRAS:
1. Ao registrar, responda: "✅ Registrado! [ID] - [Valor] - [Categoria]"
2. Use emojis.
3. Se o usuário mandar áudio (texto transcrito), interprete.
`;

export async function processarMensagemWhatsApp(textoUsuario: string, userId: string) {
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Sem chave API");

    // 1. Chama a IA (Sem Stream, resposta completa)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
       method: 'POST',
       headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'FinChat WhatsApp',
       },
       body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: textoUsuario }
        ],
        tools: [
          // Copiando as mesmas ferramentas do route.ts para consistência
          {
            type: 'function',
            function: {
              name: 'registrar_transacao',
              description: 'Cria uma nova transação',
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
          }
          // (Podemos adicionar Consultar e Editar depois para economizar tokens agora)
        ]
       })
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    
    // 2. Se a IA decidiu chamar uma ferramenta (Salvar no banco)
    if (message?.tool_calls?.length > 0) {
        const toolCall = message.tool_calls[0];
        const params = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === 'registrar_transacao') {
            // Normalizações
            if (params.categoria) params.categoria = params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1);
            if (!params.metodo_pagamento) params.metodo_pagamento = 'WhatsApp';

            // Salva no banco usando o ID do usuário que descobrimos pelo telefone
            const { data: inserido, error } = await supabaseAdmin.from('transacoes').insert({
                tipo: params.tipo,
                valor: params.valor,
                categoria: params.categoria,
                descricao: params.descricao || 'Via WhatsApp',
                metodo_pagamento: params.metodo_pagamento,
                data: params.data || new Date().toISOString(),
                usuario_id: userId
            }).select().single();

            if (error) return `❌ Erro ao salvar: ${error.message}`;
            
            return `✅ *Registrado!* (#${inserido.id_curto})\n💰 R$ ${inserido.valor}\n📂 ${inserido.categoria}`;
        }
    }

    // 3. Se foi só conversa fiada, retorna o texto da IA
    return message?.content || "Desculpe, não entendi.";

  } catch (error: any) {
    console.error("Erro Service:", error);
    return "❌ Erro interno no processamento.";
  }
}