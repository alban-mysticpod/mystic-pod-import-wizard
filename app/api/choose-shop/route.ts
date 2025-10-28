import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔵 [STEP 1] API route /api/choose-shop called');
  
  try {
    console.log('🔵 [STEP 2] Parsing request body...');
    const body = await request.json();
    console.log('✅ [STEP 2] Body parsed successfully');
    
    const { apiTokenId, shopId, userId, isDefault } = body;

    console.log('🔵 [STEP 3] Validating request parameters:');
    console.log('  - apiTokenId:', apiTokenId, '(type:', typeof apiTokenId, ')');
    console.log('  - shopId:', shopId, '(type:', typeof shopId, ')');
    console.log('  - userId:', userId, '(type:', typeof userId, ')');
    console.log('  - isDefault:', isDefault, '(type:', typeof isDefault, ')');

    if (!apiTokenId || !shopId) {
      console.error('❌ [STEP 3] Validation failed: Missing apiTokenId or shopId');
      return NextResponse.json(
        { error: 'apiTokenId and shopId are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error('❌ [STEP 3] Validation failed: Missing userId');
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    console.log('✅ [STEP 3] All parameters validated');

    const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/log-printify-shop-id';
    const payload = { 
      apiTokenId,
      shopId, 
      userId,
      isDefault: isDefault || false // Default to false if not provided
    };
    
    console.log('🔵 [STEP 4] Preparing n8n webhook call:');
    console.log('  - URL:', webhookUrl);
    console.log('  - Method: POST');
    console.log('  - Headers: { "Content-Type": "application/json" }');
    console.log('  - Payload:', JSON.stringify(payload, null, 2));

    console.log('🔵 [STEP 5] Initiating fetch to n8n...');
    const startTime = Date.now();
    
    let n8nResponse;
    try {
      n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('✅ [STEP 5] Fetch completed (no network error)');
    } catch (fetchError) {
      console.error('❌ [STEP 5] Fetch failed with network error:', fetchError);
      console.error('❌ Error details:', {
        message: fetchError instanceof Error ? fetchError.message : String(fetchError),
        stack: fetchError instanceof Error ? fetchError.stack : 'No stack',
        name: fetchError instanceof Error ? fetchError.name : 'Unknown',
      });
      throw fetchError; // Re-throw to be caught by outer try-catch
    }
    
    const duration = Date.now() - startTime;

    console.log('🔵 [STEP 6] Analyzing n8n response:');
    console.log(`  - Duration: ${duration}ms`);
    console.log('  - Status:', n8nResponse.status, n8nResponse.statusText);
    console.log('  - Headers:', JSON.stringify(Object.fromEntries(n8nResponse.headers.entries()), null, 2));

    if (!n8nResponse.ok) {
      console.error('❌ [STEP 6] n8n returned error status:', n8nResponse.status);
      
      console.log('🔵 [STEP 7] Reading error response body...');
      const errorText = await n8nResponse.text();
      console.error('❌ [STEP 7] Error response body:', errorText);
      
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
    
    console.log('✅ [STEP 6] n8n returned success status (2xx)');

    console.log('🔵 [STEP 7] Reading response body...');
    const responseText = await n8nResponse.text();
    console.log('✅ [STEP 7] Response body read');
    console.log('  - Length:', responseText.length, 'characters');
    console.log('  - Raw:', responseText);

    console.log('🔵 [STEP 8] Parsing JSON response...');
    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
      console.log('✅ [STEP 8] JSON parsed successfully');
      console.log('  - Parsed data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('❌ [STEP 8] JSON parsing failed:', parseError);
      console.error('  - Parse error message:', parseError instanceof Error ? parseError.message : String(parseError));
      console.error('  - Raw response was:', responseText);
      return NextResponse.json(
        { 
          error: 'n8n returned invalid JSON response',
          details: responseText 
        },
        { status: 500 }
      );
    }

    console.log('🔵 [STEP 9] Validating response structure...');
    
    // Validate that response contains required fields: id and name
    if (!responseData.id || !responseData.name) {
      console.error('❌ [STEP 9] Response validation failed: missing required fields (id or name)');
      console.error('  - Response keys:', Object.keys(responseData));
      console.error('  - id:', responseData.id);
      console.error('  - name:', responseData.name);
      console.error('  - Full response:', responseData);
      return NextResponse.json(
        { 
          error: 'n8n webhook did not return required fields (id, name)',
          details: responseData 
        },
        { status: 500 }
      );
    }
    
    console.log('✅ [STEP 9] Response validated successfully');
    console.log('  - Store ID:', responseData.id);
    console.log('  - Store name:', responseData.name);
    console.log('  - Shop ID:', responseData.shop_id);

    console.log('✅ [STEP 10] Shop selection completed successfully!');
    console.log('  - Final response:', responseData);

    // Return success with store data
    return NextResponse.json({ 
      success: true, 
      store: responseData 
    });
  } catch (error) {
    console.error('❌ [ERROR] Unexpected error in /api/choose-shop:');
    console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('  - Error message:', error instanceof Error ? error.message : String(error));
    console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
