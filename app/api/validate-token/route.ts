import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiToken, userId, importId, name, is_default } = body;

    if (!apiToken) {
      return NextResponse.json(
        { error: 'apiToken is required' },
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

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/verify-printify-token';
    const payload = { apiToken, userId, importId, name: name || null, is_default: is_default || false };
    
    console.log('🚀 Proxying Printify token request to n8n webhook:');
    console.log('- URL:', webhookUrl);
    console.log('- Payload:', { apiToken: '***HIDDEN***', userId, importId, name, is_default }); // Ne pas logger le token complet

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
          error: `Webhook failed: ${n8nResponse.statusText}`,
          details: errorText,
          webhookUrl 
        },
        { status: n8nResponse.status }
      );
    }

    // Lire la réponse comme texte d'abord pour déboguer
    const responseText = await n8nResponse.text();
    console.log('📦 Raw response text:', responseText);
    console.log('📦 Response length:', responseText.length);
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from n8n webhook');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Raw response that failed to parse:', responseText);
      throw new Error(`Invalid JSON response from webhook: ${responseText.substring(0, 200)}...`);
    }
    
    console.log('✅ n8n webhook response received');
    console.log('📦 Parsed data:', data);
    console.log('📦 Response structure:', {
      hasShops: !!(data.shops),
      shopsCount: data.shops?.length || 0,
      hasTokenRef: !!(data.tokenRef),
      responseKeys: Object.keys(data || {})
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
