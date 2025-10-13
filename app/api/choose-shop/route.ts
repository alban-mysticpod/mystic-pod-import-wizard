import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenRef, shopId, userId, importId } = body;

    if (!tokenRef || !shopId) {
      return NextResponse.json(
        { error: 'tokenRef and shopId are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!importId) {
      return NextResponse.json(
        { error: 'importId is required' },
        { status: 400 }
      );
    }

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/log-printify-shop-id';
    const payload = { tokenRef, shopId, userId, importId };
    
    console.log('🚀 Logging shop selection to n8n webhook:');
    console.log('- URL:', webhookUrl);
    console.log('- Payload:', payload);

    // Faire la requête vers le webhook n8n
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📦 n8n response status:', n8nResponse.status);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n webhook error:', n8nResponse.status, n8nResponse.statusText);
      console.error('❌ n8n error response:', errorText);
      
      return NextResponse.json(
        { 
          error: `Webhook failed: ${n8nResponse.statusText}`,
          details: errorText,
          webhookUrl 
        },
        { status: n8nResponse.status }
      );
    }

    // Peu importe la réponse, tant qu'elle est 200, on considère que c'est OK
    const responseText = await n8nResponse.text();
    console.log('✅ Shop selection logged successfully');
    console.log('📦 Response:', responseText);

    // Retourner simplement OK
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
