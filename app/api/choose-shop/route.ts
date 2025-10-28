import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiTokenId, shopId, userId, importId } = body;

    console.log('📥 Received shop selection request:');
    console.log('- apiTokenId:', apiTokenId);
    console.log('- shopId:', shopId);
    console.log('- userId:', userId);
    console.log('- importId:', importId);

    if (!apiTokenId || !shopId) {
      console.error('❌ Missing required fields: apiTokenId or shopId');
      return NextResponse.json(
        { error: 'apiTokenId and shopId are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error('❌ Missing required field: userId');
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!importId) {
      console.error('❌ Missing required field: importId');
      return NextResponse.json(
        { error: 'importId is required' },
        { status: 400 }
      );
    }

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/log-printify-shop-id';
    const payload = { 
      apiTokenId,  // Send token ID, not the token itself (security)
      shopId, 
      userId, 
      importId 
    };
    
    console.log('🚀 Calling n8n webhook:');
    console.log('- URL:', webhookUrl);
    console.log('- Payload:', JSON.stringify(payload, null, 2));

    // Faire la requête vers le webhook n8n
    const startTime = Date.now();
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const duration = Date.now() - startTime;

    console.log(`📦 n8n response received in ${duration}ms`);
    console.log('- Status:', n8nResponse.status, n8nResponse.statusText);
    console.log('- Headers:', Object.fromEntries(n8nResponse.headers.entries()));

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n webhook returned error status:', n8nResponse.status);
      console.error('❌ Error response body:', errorText);
      
      return NextResponse.json(
        { 
          error: `n8n webhook failed: ${n8nResponse.statusText}`,
          details: errorText,
          webhookUrl,
          status: n8nResponse.status
        },
        { status: n8nResponse.status }
      );
    }

    // Parse and validate response
    const responseText = await n8nResponse.text();
    console.log('📥 n8n response body (raw):', responseText);

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('📥 n8n response body (parsed):', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('⚠️ n8n response is not valid JSON:', parseError);
      console.error('⚠️ Raw response:', responseText);
      return NextResponse.json(
        { 
          error: 'n8n returned invalid JSON response',
          details: responseText 
        },
        { status: 500 }
      );
    }

    // Validate expected response structure
    if (!responseData.success) {
      console.error('❌ n8n response missing "success" field');
      console.error('❌ Response data:', responseData);
      return NextResponse.json(
        { 
          error: 'n8n webhook did not return success',
          details: responseData 
        },
        { status: 500 }
      );
    }

    console.log('✅ Shop selection logged successfully');
    console.log('✅ Response validated:', responseData);

    // Return the response from n8n
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Unexpected error in /api/choose-shop:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
