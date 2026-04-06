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

    // 🧠 O NOVO CÉREBRO: Com o seu Catálogo Oficial
    const SYSTEM_PROMPT = `
Você é o FinChat Pro, um assistente financeiro de WhatsApp altamente inteligente.
Sua missão é ouvir, ler imagens (recibos) e interpretar gastos, acionando SEMPRE as ferramentas de banco de dados.

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
- Outros: Outros

REGRAS ABSOLUTAS:
1. CATEGORIZAÇÃO INDIVIDUAL: Tente usar as categorias da lista acima. PORÉM, se o usuário pedir para criar ou registrar em uma categoria/subcategoria diferente, OBEDEÇA E CRIE. O banco de dados separa tudo por usuário, então não afetará outras pessoas.
2. LISTAR CATEGORIAS: Se o usuário não souber onde classificar e perguntar "Quais são as categorias?", liste o Catálogo Padrão de forma amigável para ele escolher.
3. MEMÓRIA: Você tem acesso ao histórico. Se o usuário responder só com um valor, olhe o histórico para saber do que ele fala e registre a transação.
4. DESCRIÇÃO OBRIGATÓRIA: Nunca use "Via WhatsApp". Escreva exatamente o que foi comprado.
5. DATAS: Hoje é ${dataAtual}. Ano ${anoAtual}. Formato para o banco: YYYY-MM-DD.
`;

    const userContent: any[] = [];

    if (texto) {
      userContent.push({ type: 'text', text: texto });
    } else if (midia && midia.tipo === 'audio') {
      userContent.push({ type: 'text', text: 'Transcreva este áudio com atenção cirúrgica aos valores numéricos e registre a transação.' });
    } else if (midia && midia.tipo === 'image') {
      userContent.push({ type: 'text', text: 'Leia este recibo/imagem com precisão, identifique o estabelecimento, data e valor total, e registre a transação.' });
    }

    if (midia && midia.data) {
      const dataUri = `data:${midia.mimeType};base64,${midia.data}`;
      userContent.push({
        type: 'image_url',
        image_url: { url: dataUri }
      });
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
              description: 'Salva uma nova transação financeira',
              parameters: {
                type: 'object',
                properties: {
                  tipo: { type: 'string', enum: ['despesa', 'receita'] },
                  valor: { type: 'number' },
                  categoria: { type: 'string' },
                  subcategoria: { type: 'string' },
                  descricao: { type: 'string', description: 'O item exato que foi comprado ou pago.' },
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
              name: 'gerar_relatorio',
              description: 'Gera relatório com filtros',
              parameters: {
                type: 'object',
                properties: {
                  periodo: { type: 'string', enum: ['hoje', 'semana', 'mes', 'sempre'] },
                  categoria: { type: 'string' },
                  subcategoria: { type: 'string' }
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
    let respostaFinal = "Desculpe, não entendi.";
    
    if (message?.tool_calls?.length > 0) {
        const toolCall = message.tool_calls[0];
        const params = JSON.parse(toolCall.function.arguments);
        const funcName = toolCall.function.name;

        if (funcName === 'registrar_transacao') {
            let dataFinal = new Date().toISOString();
            if (params.data) dataFinal = params.data.includes('T') ? params.data : `${params.data}T12:00:00-03:00`;

            const { data: inserido, error } = await supabaseAdmin.from('transacoes').insert({
                tipo: params.tipo,
                valor: params.valor,
                categoria: params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1),
                subcategoria: params.subcategoria.charAt(0).toUpperCase() + params.subcategoria.slice(1),
                descricao: params.descricao,
                metodo_pagamento: params.metodo_pagamento || 'WhatsApp',
                data: dataFinal,
                usuario_id: userId
            }).select().single();

            if (error) {
                respostaFinal = `❌ Erro ao salvar: ${error.message}`;
            } else {
                const dataFormatada = new Date(inserido.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                respostaFinal = `✅ Anotado! Transação #${inserido.id_curto}\n💰 R$ ${inserido.valor.toFixed(2)}\n📂 ${inserido.categoria} > ${inserido.subcategoria}\n📝 ${inserido.descricao}\n📅 Data: ${dataFormatada}`;
            }
        } else if (funcName === 'gerar_relatorio') {
            const { periodo, categoria, subcategoria } = params;
            
            let dataInicio = new Date();
            dataInicio.setHours(0,0,0,0);

            if (periodo === 'semana') dataInicio.setDate(dataInicio.getDate() - 7);
            else if (periodo === 'mes') dataInicio.setDate(1); 
            else if (periodo === 'sempre') dataInicio = new Date('2000-01-01');

            let query = supabaseAdmin.from('transacoes').select('*').eq('usuario_id', userId).gte('data', dataInicio.toISOString());
            if (categoria) query = query.ilike('categoria', `%${categoria}%`); 
            if (subcategoria) query = query.ilike('subcategoria', `%${subcategoria}%`); 

            const { data: transacoes, error } = await query;

            if (error || !transacoes || transacoes.length === 0) {
                 respostaFinal = `📊 *Relatório*\nNenhuma transação encontrada com esses filtros.`;
            } else {
                let total = 0;
                transacoes.forEach((t: any) => total += t.valor);
                const linkApp = `https://sisfin.vercel.app/dashboard`;
                respostaFinal = `📊 *Seu Relatório*\nTotal Encontrado: R$ ${total.toFixed(2)}\n\n🔗 *Veja com gráficos no App:*\n${linkApp}`;
            }
        }
    } else {
        respostaFinal = message?.content || "Desculpe, não consegui processar o pedido.";
    }

    historico.push({ role: "user", content: texto || (midia?.tipo === 'audio' ? '[Áudio enviado]' : '') });
    historico.push({ role: "assistant", content: respostaFinal });

    if (historico.length > 6) historico = historico.slice(historico.length - 6);

    await supabaseAdmin
        .from('usuarios_whatsapp')
        .update({ historico_mensagens: historico })
        .eq('user_id', userId);

    return respostaFinal;

  } catch (error: any) {
    return "❌ Erro interno no processamento.";
  }
}