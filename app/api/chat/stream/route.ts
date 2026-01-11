import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `
Você é o FinChat Pro, um assistente financeiro completo.
Sua missão é Registrar, Consultar e Editar transações usando IDs numéricos simples.

REGRAS DE FORMATAÇÃO (OBRIGATÓRIO):
Sempre que realizar uma ação, retorne este bloco:
---
🆔 **ID:** #[Número]
💰 **Valor:** R$ [Valor]
📝 **Descrição:** [Descrição]
📂 **Categoria:** [Categoria]
📅 **Data:** [DD/MM/AAAA]
---

REGRAS DE INTERAÇÃO:
1. **Registrar:** Se o usuário falar "gastei X", use 'registrar_transacao'.
2. **Consultar:** Se o usuário pedir "ver transação 61" ou "detalhes do #61", use 'consultar_transacao'.
3. **Editar:** Se o usuário pedir "altere o valor do #61 para Y", use 'editar_transacao'.
   - O ID é sempre um NÚMERO (ex: 61, 105).

Seja flexível com categorias e métodos de pagamento.
`;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });

    const { messages } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) throw new Error("Chave API não configurada.");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
       method: 'POST',
       headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'FinChat Brasil Pro',
       },
       body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        temperature: 0.1,
        max_tokens: 2000,
        tools: [
          // 1. REGISTRAR
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
          },
          // 2. CONSULTAR
          {
            type: 'function',
            function: {
              name: 'consultar_transacao',
              description: 'Busca transação pelo ID Numérico (ex: 61)',
              parameters: {
                type: 'object',
                properties: {
                  id_numero: { type: 'integer', description: 'O número do ID (ex: 61)' }
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
              description: 'Atualiza transação pelo ID Numérico',
              parameters: {
                type: 'object',
                properties: {
                  id_numero: { type: 'integer', description: 'O número do ID a alterar (ex: 61)' },
                  valor: { type: 'number' },
                  categoria: { type: 'string' },
                  descricao: { type: 'string' },
                  metodo_pagamento: { type: 'string' },
                  data: { type: 'string' },
                  tipo: { type: 'string', enum: ['despesa', 'receita'] }
                },
                required: ['id_numero']
              }
            }
          }
        ]
       })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro IA (${response.status}): ${text}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        // @ts-ignore
        const reader = response.body.getReader();
        let buffer = ''; 

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; 

            for (const line of lines) {
              if (line.trim() === '' || line === 'data: [DONE]') continue;
              if (line.startsWith('data: ')) {
                 try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.choices?.[0]?.delta?.content) {
                        const content = data.choices[0].delta.content;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`));
                    }

                    if (data.choices?.[0]?.delta?.tool_calls) {
                        const toolCall = data.choices[0].delta.tool_calls[0];
                        const funcName = toolCall.function.name;
                        const args = toolCall.function.arguments;
                        
                        if (args && args.trim().endsWith('}')) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ thinking: true })}\n\n`));
                            
                            const params = JSON.parse(args);
                            console.log(`🛠️ Executando ${funcName}:`, params);
                            
                            let resultText = '';

                            // --- LÓGICA DE EXECUÇÃO ---

                            if (funcName === 'registrar_transacao') {
                                if (params.categoria) params.categoria = params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1);
                                if (!params.metodo_pagamento) params.metodo_pagamento = 'Outros';

                                // Registrar continua usando .single() pois insert sempre retorna 1 se der certo
                                const { data: inserido, error } = await supabase.from('transacoes').insert({
                                    tipo: params.tipo,
                                    valor: params.valor,
                                    categoria: params.categoria,
                                    descricao: params.descricao || params.categoria,
                                    metodo_pagamento: params.metodo_pagamento,
                                    data: params.data || new Date().toISOString(),
                                    usuario_id: user.id
                                }).select().single();

                                if (error) resultText = `❌ Erro ao registrar: ${error.message}`;
                                else resultText = `✅ Transação Registrada!\n\n🆔 **ID:** #${inserido.id_curto}\n💰 **Valor:** R$ ${inserido.valor}\n📝 **Descrição:** ${inserido.descricao}\n📂 **Categoria:** ${inserido.categoria}\n📅 **Data:** ${new Date(inserido.data).toLocaleDateString('pt-BR')}`;
                            } 
                            
                            else if (funcName === 'consultar_transacao') {
                                // MUDANÇA: .maybeSingle() para não dar erro se não achar
                                const { data: item, error } = await supabase.from('transacoes')
                                    .select('*')
                                    .eq('id_curto', params.id_numero)
                                    .eq('usuario_id', user.id)
                                    .maybeSingle();

                                if (error) resultText = `❌ Erro na busca: ${error.message}`;
                                else if (!item) resultText = `⚠️ Não encontrei a transação #${params.id_numero}. Verifique se o número está correto.`;
                                else resultText = `🔍 Detalhes da Transação:\n\n🆔 **ID:** #${item.id_curto}\n💰 **Valor:** R$ ${item.valor}\n📝 **Descrição:** ${item.descricao}\n📂 **Categoria:** ${item.categoria}\n📅 **Data:** ${new Date(item.data).toLocaleDateString('pt-BR')}`;
                            }

                            else if (funcName === 'editar_transacao') {
                                const idBusca = params.id_numero;
                                delete params.id_numero; 

                                // 🕵️ DEBUG: Vamos ver quem está tentando editar o quê
                                console.log(`🔍 TENTATIVA DE EDIÇÃO:`);
                                console.log(`   - Usuário Logado (Token): ${user.id}`);
                                console.log(`   - Tentando editar ID Curto: ${idBusca}`);
                                console.log(`   - Dados a atualizar:`, params);

                                const { data: atualizado, error } = await supabase.from('transacoes')
                                    .update(params)
                                    .eq('id_curto', idBusca)
                                    .eq('usuario_id', user.id) // <--- O culpado costuma ser isso aqui
                                    .select()
                                    .maybeSingle();

                                if (error) {
                                    console.error("❌ Erro no Supabase:", error);
                                    resultText = `❌ Erro técnico ao editar #${idBusca}: ${error.message}`;
                                } 
                                else if (!atualizado) {
                                    // Se entrou aqui, o RLS bloqueou OU o user.id não bate
                                    console.warn("⚠️ Retorno vazio. Verifique se o ID pertence ao usuário.");
                                    resultText = `⚠️ Não consegui editar a transação #${idBusca}. O sistema confirma que ela existe, mas o seu Usuário atual (${user.id.slice(0,5)}...) não é o dono dela.`;
                                } 
                                else {
                                    resultText = `✏️ Transação #${atualizado.id_curto} Atualizada!\n\n💰 **Novo Valor:** R$ ${atualizado.valor}\n📂 **Nova Categoria:** ${atualizado.categoria}\n📝 **Nova Descrição:** ${atualizado.descricao}`;
                                }
                            }

                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: `\n\n${resultText}\n\n` })}\n\n`));
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ thinking: false })}\n\n`));
                        }
                    }
                 } catch (e) { }
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });

  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}