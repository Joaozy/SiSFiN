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

export async function processarMensagemWhatsApp(
    texto: string | null, 
    userId: string, 
    midia?: { tipo: 'image' | 'audio', data: string, mimeType: string }
) {
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Sem chave API");

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
          },
          {
            type: 'function',
            function: {
              name: 'gerar_relatorio',
              description: 'Gera um relatório somando os valores de um período (hoje, semana, mes, sempre) e opcionalmente filtra por categoria.',
              parameters: {
                type: 'object',
                properties: {
                  periodo: { type: 'string', enum: ['hoje', 'semana', 'mes', 'sempre'] },
                  categoria: { type: 'string', description: 'Deixe vazio para ver todas.' },
                  tipo: { type: 'string', enum: ['despesa', 'receita', 'ambos'] }
                },
                required: ['periodo']
              }
            }
          }
        ]
       })
    });

    const data = await response.json();
    
    console.log("\n🤖 --- RESPOSTA DO OPENROUTER ---");
    console.log(JSON.stringify(data, null, 2));
    console.log("----------------------------------\n");

    if (data.error) {
        return `❌ Erro na IA: ${data.error.message}`;
    }

    const message = data.choices?.[0]?.message;
    
    if (message?.tool_calls?.length > 0) {
        const toolCall = message.tool_calls[0];
        const params = JSON.parse(toolCall.function.arguments);
        const funcName = toolCall.function.name;

        // 1. FERRAMENTA DE REGISTAR
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

            if (error) {
                console.error("Erro no Supabase:", error);
                return `❌ Erro ao salvar no banco: ${error.message}`;
            }
            
            const dataFormatada = new Date(inserido.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

            return `✅ Anotado! Transacao #${inserido.id_curto}\n💰 R$ ${inserido.valor.toFixed(2)}\n📂 ${inserido.categoria}\n📝 ${inserido.descricao}\n📅 data: ${dataFormatada}`;
        }

        // 2. FERRAMENTA DE EDITAR
        else if (funcName === 'editar_transacao') {
            const atualizacoes: any = {};
            if (params.valor) atualizacoes.valor = params.valor;
            if (params.categoria) atualizacoes.categoria = params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1);
            if (params.descricao) atualizacoes.descricao = params.descricao;
            if (params.tipo) atualizacoes.tipo = params.tipo;

            const { data: editado, error } = await supabaseAdmin
                .from('transacoes')
                .update(atualizacoes)
                .eq('id_curto', params.id_numero)
                .eq('usuario_id', userId)
                .select().single();

            if (error) {
                console.error("Erro ao editar no Supabase:", error);
                return `❌ Erro ao editar a transação: ${error.message}`;
            }

            if (!editado) {
                return `⚠️ Não encontrei a transação #${params.id_numero}. Tem certeza que o número está correto?`;
            }

            const dataFormatada = new Date(editado.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            
            return `✏️ *Transação #${editado.id_curto} alterada com sucesso!*\n💰 R$ ${editado.valor.toFixed(2)}\n📂 ${editado.categoria}\n📝 ${editado.descricao}\n📅 data: ${dataFormatada}`;
        }

        // 3. FERRAMENTA DE RELATÓRIO
        else if (funcName === 'gerar_relatorio') {
            const { periodo, categoria, tipo } = params;
            
            let dataInicio = new Date();
            dataInicio.setHours(0,0,0,0);

            if (periodo === 'semana') {
                dataInicio.setDate(dataInicio.getDate() - 7);
            } else if (periodo === 'mes') {
                dataInicio.setDate(1); 
            } else if (periodo === 'sempre') {
                dataInicio = new Date('2000-01-01');
            }

            let query = supabaseAdmin
                .from('transacoes')
                .select('*')
                .eq('usuario_id', userId)
                .gte('data', dataInicio.toISOString());

            if (categoria) {
                query = query.ilike('categoria', `%${categoria}%`); 
            }

            const { data: transacoes, error } = await query;

            if (error) return `❌ Erro ao buscar relatório: ${error.message}`;
            if (!transacoes || transacoes.length === 0) return `📊 *Relatório (${periodo})*\nNenhuma transação encontrada neste período.`;

            let totalDespesas = 0;
            let totalReceitas = 0;
            let categoriasCount: Record<string, number> = {};

            transacoes.forEach((t: any) => {
                if (t.tipo === 'despesa') {
                    totalDespesas += t.valor;
                    if(!categoriasCount[t.categoria]) categoriasCount[t.categoria] = 0;
                    categoriasCount[t.categoria] += t.valor;
                } else {
                    totalReceitas += t.valor;
                }
            });

            let resposta = `📊 *Seu Relatório (${periodo})*\n\n`;
            if (tipo !== 'receita') resposta += `🔴 Despesas: R$ ${totalDespesas.toFixed(2)}\n`;
            if (tipo !== 'despesa') resposta += `🟢 Receitas: R$ ${totalReceitas.toFixed(2)}\n`;
            
            if (!categoria && totalDespesas > 0) {
                 resposta += `\n*Onde você mais gastou:*\n`;
                 const ranking = Object.entries(categoriasCount).sort((a, b) => b[1] - a[1]);
                 for(let [cat, val] of ranking) {
                     resposta += `📂 ${cat}: R$ ${val.toFixed(2)}\n`;
                 }
            }

            return resposta;
        }
    }

    return message?.content || "Desculpe, não entendi.";

  } catch (error: any) {
    console.error("Erro Service:", error);
    return "❌ Erro interno no processamento.";
  }
}