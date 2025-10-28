import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folderId, shopId, userId, importId, pushToShopify } = body;

    if (!folderId || !shopId || !userId) {
      return NextResponse.json(
        { error: 'folderId, shopId, and userId are required' },
        { status: 400 }
      );
    }

    if (!importId) {
      return NextResponse.json(
        { error: 'importId is required' },
        { status: 400 }
      );
    }

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/import-to-printify';
    const payload = { folderId, shopId, userId, importId, pushToShopify: pushToShopify || false };
    
    console.log('🚀 Starting import to Printify via n8n webhook');
    console.log('- URL:', webhookUrl);
    console.log('- folderId:', folderId, '- shopId:', shopId, '- userId:', userId, '- importId:', importId, '- pushToShopify:', pushToShopify || false);

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
          error: `Import failed: ${n8nResponse.statusText}`,
          details: errorText,
          webhookUrl 
        },
        { status: n8nResponse.status }
      );
    }

    const data = await n8nResponse.json();
    console.log('✅ Import completed successfully:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
