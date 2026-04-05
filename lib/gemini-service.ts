import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const SYSTEM_PROMPT = `
Você é o FinChat Pro, um assistente financeiro inteligente de WhatsApp.
Sua missão é interpretar as mensagens e OBRIGATORIAMENTE acionar as ferramentas de banco de dados.

REGRAS ABSOLUTAS:
1. SEMPRE que o usuário relatar um gasto, compra ou recebimento (seja por texto, áudio ou imagem), VOCÊ DEVE chamar a ferramenta 'registrar_transacao'. Não responda apenas com texto.
2. Extraia o valor numérico, defina se é 'despesa' ou 'receita' e crie uma categoria curta (ex: Alimentação, Transporte, Lazer).
3. Para consultar ou editar, use as ferramentas correspondentes indicando o ID Numérico.
4. Assuma que a data é sempre "Hoje" (formato ISO), a menos que o usuário especifique outra.
`;

// Função principal que processa Texto ou Mídia
export async function processarMensagemWhatsApp(
    texto: string | null, 
    userId: string, 
    midia?: { tipo: 'image' | 'audio', data: string, mimeType: string }
) {
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Sem chave API");

    // Monta a mensagem para a IA
    const userContent: any[] = [];
    
    if (texto) userContent.push({ type: 'text', text: texto });
    
    if (midia) {
        userContent.push({
            type: 'image_url',
            image_url: {
                url: `data:${midia.mimeType};base64,${midia.data}`
            }
        });
        if (midia.tipo === 'audio' && !texto) {
             userContent.push({ type: 'text', text: "Ouça este áudio, transcreva e registre a transação." });
        }
        if (midia.tipo === 'image' && !texto) {
            userContent.push({ type: 'text', text: "Analise esta imagem, extraia os dados financeiros e registre a transação." });
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
        model: 'google/gemini-2.5-flash',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent }
        ],
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
                  descricao: { type: 'string' },
                  metodo_pagamento: { type: 'string' },
                  data: { type: 'string' }
                },
                required: ['tipo', 'valor', 'categoria']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'consultar_transacao',
              description: 'Busca transação pelo ID Numérico',
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
              name: 'editar_transacao',
              description: 'Edita transação pelo ID Numérico',
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
    
    // 🔥 DEDO-DURO: Vai imprimir no terminal do VS Code exatamente o que o OpenRouter respondeu
    console.log("\n🤖 --- RESPOSTA DO OPENROUTER ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("----------------------------------\n");

    // Verifica se houve erro de API (ex: sem créditos, erro de modelo)
    if (data.error) {
        return `❌ Erro na IA: ${data.error.message}`;
    }

    const message = data.choices?.[0]?.message;
    
    // EXECUÇÃO DAS FERRAMENTAS
    if (message?.tool_calls?.length > 0) {
        const toolCall = message.tool_calls[0];
        const params = JSON.parse(toolCall.function.arguments);
        const funcName = toolCall.function.name;

        if (funcName === 'registrar_transacao') {
            if (params.categoria) params.categoria = params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1);
            if (!params.metodo_pagamento) params.metodo_pagamento = 'WhatsApp';

            // ATENÇÃO AQUI: Tenta inserir no Supabase
            const { data: inserido, error } = await supabaseAdmin.from('transacoes').insert({
                tipo: params.tipo,
                valor: params.valor,
                categoria: params.categoria,
                descricao: params.descricao || 'Via WhatsApp',
                metodo_pagamento: params.metodo_pagamento,
                data: params.data || new Date().toISOString(),
                usuario_id: userId
            }).select().single();

            if (error) {
                console.error("Erro no Supabase:", error);
                return `❌ Erro ao salvar no banco: ${error.message}`;
            }
            
            // Retorno de sucesso formatado
            return `✅ *Anotado!* \n💰 R$ ${inserido.valor.toFixed(2)}\n📂 ${inserido.categoria}\n📝 ${inserido.descricao}`;
        }

        // ... as outras ferramentas de consulta e edição continuam aqui ...
    }

    // Se a IA não chamou nenhuma ferramenta e mandou texto
    return message?.content || "Desculpe, não entendi.";

  } catch (error: any) {
    console.error("Erro Service:", error);
    return "❌ Erro interno no processamento.";
  }
}