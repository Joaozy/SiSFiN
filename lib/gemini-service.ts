import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function processarMensagemWhatsApp(
    texto: string | null, 
    telefone: string,
    usuarioDb: any | null, 
    midia?: { tipo: 'image' | 'audio', data: string, mimeType: string }
): Promise<{ texto: string, pdfUrl?: string }> { 
  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Sem chave API");

    const hoje = new Date();
    const dataAtual = hoje.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const anoAtual = hoje.getFullYear();

    // =======================================================================
    // 🧠 CÉREBRO 1: MODO ONBOARDING (COM MEMÓRIA TEMPORÁRIA)
    // =======================================================================
    if (!usuarioDb) {
        // 1. Busca a memória da sala de espera
        const { data: tempDb } = await supabaseAdmin.from('onboarding_temp').select('historico').eq('telefone', telefone).single();
        let historicoOnboarding = tempDb?.historico || [];
        if (!Array.isArray(historicoOnboarding)) historicoOnboarding = [];

        const ONBOARDING_PROMPT = `
Você é o FinChat, um assistente financeiro de WhatsApp.
O usuário enviou uma mensagem pela primeira vez e NÃO tem cadastro.

SUA MISSÃO:
1. Dê as boas-vindas calorosas e explique brevemente que você é uma IA que organiza gastos via WhatsApp.
2. Peça o NOME e o E-MAIL do usuário para criar a conta.
3. Se ele informar apenas o nome, peça o e-mail. Se informar apenas o e-mail, peça o nome.
4. Se ele já forneceu AMBOS (Nome e E-mail) durante a conversa, acione IMEDIATAMENTE a ferramenta 'criar_conta_whatsapp'.
`;

        const mensagensParaIA = [
            { role: "system", content: ONBOARDING_PROMPT },
            ...historicoOnboarding,
            { role: "user", content: texto || "Olá" }
        ];

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-001", 
              messages: mensagensParaIA,
              tools: [{
                  type: 'function',
                  function: {
                    name: 'criar_conta_whatsapp',
                    description: 'Cria o cadastro do usuário no banco de dados',
                    parameters: {
                      type: 'object',
                      properties: { nome: { type: 'string' }, email: { type: 'string' } },
                      required: ['nome', 'email']
                    }
                  }
              }]
            })
        });

        const data = await response.json();
        const message = data.choices?.[0]?.message;

        // Se a IA tiver dados suficientes para criar a conta
        if (message?.tool_calls?.length > 0) {
            const params = JSON.parse(message.tool_calls[0].function.arguments);
            const senhaTemporaria = `Fin@${Math.floor(Math.random() * 9000) + 1000}`;

            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: params.email,
                password: senhaTemporaria,
                email_confirm: true
            });

            if (authError || !authUser.user) {
                return { texto: `❌ Ops, ocorreu um erro ao criar sua conta web: ${authError?.message}` };
            }

            await supabaseAdmin.from('usuarios_whatsapp').insert({
                user_id: authUser.user.id,
                telefone: telefone,
                nome: params.nome,
                historico_mensagens: []
            });

            // Limpa a memória temporária pois o usuário já está cadastrado
            await supabaseAdmin.from('onboarding_temp').delete().eq('telefone', telefone);

            return { texto: `🎉 *Conta Criada com Sucesso, ${params.nome}!* \n\nSua área web exclusiva já está pronta.\n🔗 Painel: https://sisfin.vercel.app\n✉️ Email: ${params.email}\n🔑 Senha temp: ${senhaTemporaria}\n\nVocê quer um tutorial rápido de como eu funciono, ou já quer começar a me mandar as suas despesas?` };
        }

        // Se ainda faltar informações, responde e salva na memória temporária
        let respostaTexto = message?.content || "Olá! Bem-vindo! Qual o seu nome e e-mail para começarmos?";
        
        historicoOnboarding.push({ role: "user", content: texto || "Olá" });
        historicoOnboarding.push({ role: "assistant", content: respostaTexto });
        if (historicoOnboarding.length > 6) historicoOnboarding = historicoOnboarding.slice(historicoOnboarding.length - 6);

        await supabaseAdmin.from('onboarding_temp').upsert({
            telefone: telefone,
            historico: historicoOnboarding
        });

        return { texto: respostaTexto };
    }

    // =======================================================================
    // 🧠 CÉREBRO 2: MODO FINANCEIRO (O USUÁRIO JÁ TEM CONTA)
    // =======================================================================
    const userId = usuarioDb.user_id;
    let historico = usuarioDb.historico_mensagens || [];
    if (!Array.isArray(historico)) historico = [];

    const SYSTEM_PROMPT = `
Você é o FinChat Pro, um assistente financeiro de WhatsApp inteligente.

CATÁLOGO PADRÃO DE CATEGORIAS:
- Renda: Salário, Rendimentos, Extra
- Moradia: Aluguel, Luz, Água, Internet, Gás
- Transporte: Combustível, App, Ônibus, Reparos
- Saude: Consulta, Farmácia, Plano
- Vida Diaria: Supermercado, Padaria, Restaurante
- Entretenimento: Shows, Assinaturas, Viagem
- Outros: (Use se não encaixar em nada)

REGRAS DE OURO:
1. GASTOS (ZERO PERGUNTAS): Se for um gasto, extraia o valor e acione a ferramenta 'registrar_transacao' na hora. Se o usuário não informar a categoria, você DEDUZA e escolha a melhor opção sozinho. Nunca faça perguntas.
2. 🚨 FOCO EM ÁUDIOS E NÚMEROS: Ao processar um áudio ou texto, preste atenção ABSOLUTA ao número falado. Não confunda 20 com 25, ou 60 com 70. Seja cirúrgico.
3. TUTORIAL: Se o usuário pedir um tutorial, explique que ele pode mandar textos ("Gastei 50 no mercado"), áudios ("Paguei a luz, 120 reais") ou fotos de recibos, e você anotará tudo. E que ele pode pedir resumos a qualquer momento.
4. DATAS: Hoje é ${dataAtual}. Formato YYYY-MM-DD.
`;

    const userContent: any[] = [];

    if (texto) {
      userContent.push({ type: 'text', text: texto });
    } else if (midia && midia.tipo === 'audio') {
      userContent.push({ type: 'text', text: 'MÍDIA RECEBIDA: Ouça o áudio com MÁXIMA PRECISÃO no valor falado. Deduza a categoria e acione a ferramenta registrar_transacao imediatamente, sem perguntas.' });
    } else if (midia && midia.tipo === 'image') {
      userContent.push({ type: 'text', text: 'MÍDIA RECEBIDA: Leia o recibo, encontre o valor total, deduza a categoria e registre a transação sem perguntas.' });
    }

    if (midia && midia.data) {
      const dataUri = `data:${midia.mimeType};base64,${midia.data}`;
      userContent.push({ type: 'image_url', image_url: { url: dataUri } });
    }

    const mensagensParaIA = [ { role: "system", content: SYSTEM_PROMPT }, ...historico, { role: "user", content: userContent } ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", 
        messages: mensagensParaIA,
        tools: [
          {
            type: 'function',
            function: {
              name: 'registrar_transacao',
              description: 'Salva uma transação',
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
              description: 'Altera transação por ID',
              parameters: {
                type: 'object',
                properties: { id_numero: { type: 'integer' }, valor: { type: 'number' }, categoria: { type: 'string' }, subcategoria: { type: 'string' }, descricao: { type: 'string' } },
                required: ['id_numero']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'apagar_transacao',
              description: 'Exclui transação por ID',
              parameters: { type: 'object', properties: { id_numero: { type: 'integer' } }, required: ['id_numero'] }
            }
          },
          {
            type: 'function',
            function: {
              name: 'gerar_relatorio',
              description: 'Gera relatório de gastos',
              parameters: { type: 'object', properties: { periodo: { type: 'string', enum: ['hoje', 'semana', 'mes', 'sempre'] } }, required: ['periodo'] }
            }
          }
        ]
       })
    });

    const data = await response.json();
    if (data.error) return { texto: `❌ Erro na IA: ${data.error.message}` };

    const message = data.choices?.[0]?.message;
    let respostaFinal = "Desculpe, não consegui processar. Tente novamente.";
    let linkDoPdf: string | undefined = undefined; 
    
    if (message?.tool_calls?.length > 0) {
        const params = JSON.parse(message.tool_calls[0].function.arguments);
        const funcName = message.tool_calls[0].function.name;

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

                if (inserido.tipo === 'despesa') {
                    try {
                        const { data: meta } = await supabaseAdmin.from('metas_gastos').select('valor_limite').eq('usuario_id', userId).eq('categoria', catFormatada).single();
                        if (meta) {
                            const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
                            const { data: gastos } = await supabaseAdmin.from('transacoes').select('valor').eq('usuario_id', userId).eq('categoria', catFormatada).eq('tipo', 'despesa').gte('data', mesAtual);
                            const totalGasto = gastos?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;

                            if (totalGasto > meta.valor_limite) respostaFinal += `\n\n🚨 *ALERTA DE META ESTOURADA!*\nVocê definiu limite de R$ ${meta.valor_limite.toFixed(2)} para ${catFormatada}, mas já gastou R$ ${totalGasto.toFixed(2)}.`;
                            else if (totalGasto >= meta.valor_limite * 0.8) respostaFinal += `\n\n⚠️ *AVISO DE META!*\nVocê já gastou R$ ${totalGasto.toFixed(2)} e está perto do limite de R$ ${meta.valor_limite.toFixed(2)} para ${catFormatada}.`;
                        }
                    } catch (e) {}
                }
            }
        } 
        else if (funcName === 'editar_transacao') {
            const atualizacoes: any = {};
            if (params.valor) atualizacoes.valor = params.valor;
            if (params.categoria) atualizacoes.categoria = params.categoria;
            if (params.subcategoria) atualizacoes.subcategoria = params.subcategoria;
            if (params.descricao) atualizacoes.descricao = params.descricao;

            const { data: editado, error } = await supabaseAdmin.from('transacoes').update(atualizacoes).eq('id_curto', params.id_numero).eq('usuario_id', userId).select().single();
            if (error || !editado) respostaFinal = `❌ Erro: Não encontrei a transação ID #${params.id_numero}.`;
            else respostaFinal = `✏️ *Transação Alterada*\n\n🆔 ID: ${editado.id_curto}\n💰 R$ ${editado.valor.toFixed(2)}\n📂 ${editado.categoria} > ${editado.subcategoria}`;
        }
        else if (funcName === 'apagar_transacao') {
            const { error, count } = await supabaseAdmin.from('transacoes').delete({ count: 'exact' }).eq('id_curto', params.id_numero).eq('usuario_id', userId);
            if (error || count === 0) respostaFinal = `❌ Erro: Não encontrei a transação ID #${params.id_numero}.`;
            else respostaFinal = `🗑️ *Transação Apagada!*\nA transação ID #${params.id_numero} foi removida permanentemente.`;
        }
        else if (funcName === 'gerar_relatorio') {
            const { periodo } = params;
            let dataInicio = new Date();
            dataInicio.setHours(0,0,0,0);
            
            if (periodo === 'semana') dataInicio.setDate(dataInicio.getDate() - 7);
            else if (periodo === 'mes') dataInicio.setDate(1); 
            else if (periodo === 'sempre') dataInicio = new Date('2000-01-01');

            const { data: transacoes } = await supabaseAdmin
                .from('transacoes')
                .select('*')
                .eq('usuario_id', userId)
                .gte('data', dataInicio.toISOString())
                .order('data', { ascending: false });

            if (!transacoes || transacoes.length === 0) {
                 respostaFinal = `📊 Não encontrei nenhuma transação neste período.`;
            } else {
                let totalDespesa = 0; let totalReceita = 0;
                transacoes.forEach((t: any) => t.tipo === 'despesa' ? totalDespesa += t.valor : totalReceita += t.valor);

                const doc = new jsPDF();
                doc.setFontSize(20);
                doc.text(`Seu Extrato - FinChat`, 14, 20);
                
                doc.setFontSize(12);
                doc.text(`Período: ${periodo.toUpperCase()}`, 14, 30);
                doc.text(`Total Entradas: R$ ${totalReceita.toFixed(2)}`, 14, 38);
                doc.text(`Total Saídas: R$ ${totalDespesa.toFixed(2)}`, 14, 46);

                const tableData = transacoes.map((t:any) => [
                    new Date(t.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                    t.descricao,
                    t.categoria,
                    `${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}`
                ]);

                autoTable(doc, {
                    startY: 55,
                    head: [['Data', 'Descrição', 'Categoria', 'Valor']],
                    body: tableData,
                });

                const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
                const fileName = `extrato_${userId}_${Date.now()}.pdf`;

                await supabaseAdmin.storage.from('relatorios').upload(fileName, pdfBuffer, { contentType: 'application/pdf' });
                
                const { data: urlData } = supabaseAdmin.storage.from('relatorios').getPublicUrl(fileName);
                linkDoPdf = urlData.publicUrl;

                respostaFinal = `📊 *Seu Extrato Solicitado*\n\nDespesas totais: R$ ${totalDespesa.toFixed(2)}\n\n📄 O arquivo PDF está sendo enviado logo abaixo.\n🔗 Para análises complexas, acesse: https://sisfin.vercel.app`;
            }
        }
    } else {
        respostaFinal = message?.content || "Desculpe, não consegui processar.";
    }

    historico.push({ role: "user", content: texto || "[Mídia Enviada]" });
    historico.push({ role: "assistant", content: respostaFinal });
    if (historico.length > 6) historico = historico.slice(historico.length - 6);

    await supabaseAdmin.from('usuarios_whatsapp').update({ historico_mensagens: historico }).eq('user_id', userId);

    return { texto: respostaFinal, pdfUrl: linkDoPdf }; 

  } catch (error: any) {
    return { texto: "❌ Erro interno no processamento." };
  }
}