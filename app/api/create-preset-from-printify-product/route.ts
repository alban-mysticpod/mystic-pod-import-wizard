import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/user';

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { productId, importId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
    if (!importId) {
      return NextResponse.json({ error: 'importId is required' }, { status: 400 });
    }

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/create-preset-from-printify-product';
    const payload = { productId, userId, importId };

    console.log('🚀 Calling n8n webhook for create-preset-from-printify-product:');
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
