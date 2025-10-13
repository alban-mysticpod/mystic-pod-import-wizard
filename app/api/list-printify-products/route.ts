import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/user';

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { tokenRef, importId, page = 1 } = body;

    if (!tokenRef) {
      return NextResponse.json({ error: 'tokenRef is required' }, { status: 400 });
    }
    if (!importId) {
      return NextResponse.json({ error: 'importId is required' }, { status: 400 });
    }

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/list-printify-products';
    const payload = { tokenRef, userId, importId, page };

    console.log('🚀 Calling n8n webhook for list-printify-products:');
    console.log('- URL:', webhookUrl);
    console.log('- Payload:', payload);

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n webhook error:', n8nResponse.status, n8nResponse.statusText);
      console.error('❌ n8n error response:', errorText);
      return NextResponse.json(
        { error: `Webhook failed: ${n8nResponse.statusText}`, details: errorText, webhookUrl },
        { status: n8nResponse.status }
      );
    }

    const data = await n8nResponse.json();
    console.log('✅ n8n webhook response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
