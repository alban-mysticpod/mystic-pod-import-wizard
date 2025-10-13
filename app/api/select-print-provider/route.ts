import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { printProviderId, userId, importId } = body;

    if (!printProviderId || !userId || !importId) {
      return NextResponse.json(
        { error: 'printProviderId, userId, and importId are required' },
        { status: 400 }
      );
    }

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/select-print-provider';
    const payload = { print_provider_id: printProviderId, userId, importId };
    
    console.log('🖨️ Selecting print provider via n8n webhook:');
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
    console.log('📦 n8n response headers:', Object.fromEntries(n8nResponse.headers.entries()));

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n webhook error:', n8nResponse.status, n8nResponse.statusText);
      console.error('❌ n8n error response:', errorText);
      
      return NextResponse.json(
        { 
          error: `Select print provider webhook failed: ${n8nResponse.statusText}`,
          details: errorText,
          webhookUrl 
        },
        { status: n8nResponse.status }
      );
    }

    const data = await n8nResponse.json();
    console.log('✅ Print provider selected successfully via n8n:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
