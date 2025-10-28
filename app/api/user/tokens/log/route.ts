import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/user/tokens/log
 * Logs the usage of an API token (updates last_used_at)
 * Body: { apiTokenId, userId, importId }
 * Proxies to n8n webhook: /webhook/log-printify-token
 */
export async function POST(request: NextRequest) {
  console.log('🔵 [TOKEN LOG] API route /api/user/tokens/log called');
  
  try {
    const body = await request.json();
    const { apiTokenId, userId, importId } = body;

    console.log('🔵 [TOKEN LOG] Request params:');
    console.log('  - apiTokenId:', apiTokenId);
    console.log('  - userId:', userId);
    console.log('  - importId:', importId);

    if (!apiTokenId || !userId || !importId) {
      console.error('❌ [TOKEN LOG] Missing required parameters');
      return NextResponse.json(
        { error: 'apiTokenId, userId, and importId are required' },
        { status: 400 }
      );
    }

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/log-printify-token';
    const payload = { apiTokenId, userId, importId };
    
    console.log('🚀 [TOKEN LOG] Calling n8n webhook:', webhookUrl);
    console.log('📦 [TOKEN LOG] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📡 [TOKEN LOG] n8n response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [TOKEN LOG] n8n error:', errorText);
      return NextResponse.json(
        { error: 'Failed to log token usage' },
        { status: response.status }
      );
    }

    const data = await response.json().catch(() => ({}));
    console.log('✅ [TOKEN LOG] Token usage logged successfully');

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('❌ [TOKEN LOG] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

