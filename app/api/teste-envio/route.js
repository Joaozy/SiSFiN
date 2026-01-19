import { NextResponse, NextRequest } from 'next/server'; // <--- Mudamos aqui

const FB_API_URL = 'https://graph.facebook.com/v17.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID; 
const ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;

// Mudamos de "Request" para "NextRequest" na linha abaixo
export async function GET(request: NextRequest) { 
  
  // COLOQUE SEU NÚMERO AQUI (com 55 e DDD)
  const numeroDestino = '5579991159138'; 

  try {
    const response = await fetch(`${FB_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numeroDestino,
        type: 'text',
        text: { 
            body: "✅ *COMPROVANTE DE PAGAMENTO*\n\n📅 Data: 19/01/2026\n💰 Valor: R$ 150,00\n🛒 Ref: Compra no Minimercado\n\n_Transação registrada com sucesso pelo Sistema Financeiro._" 
        },
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 });
  }
}