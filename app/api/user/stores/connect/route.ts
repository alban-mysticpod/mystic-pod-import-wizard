import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/user/stores/connect
 * Validates API token and fetches available shops
 * Body: { provider, apiToken, tokenName, userId }
 * Returns: { apiTokenId, shops }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiToken, tokenName, userId } = body;

    if (!provider || !apiToken || !userId) {
      return NextResponse.json(
        { error: 'provider, apiToken, and userId are required' },
        { status: 400 }
      );
    }

    console.log('🔗 Connecting shop for provider:', provider, 'user:', userId);

    // Step 1: Validate token and save to api_tokens table
    console.log('🚀 Step 1: Validating API token...');
    
    // For Printify, validate via n8n webhook
    if (provider === 'printify') {
      const webhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/verify-printify-token';
      const payload = { 
        apiToken, 
        userId, 
        importId: userId, // Use userId as importId for now
        name: tokenName || null,
        is_default: false // Not used anymore, but keep for backward compatibility
      };
      
      console.log('🚀 Proxying Printify token validation to n8n webhook');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ n8n webhook error:', errorText);
        return NextResponse.json(
          { error: 'Failed to validate API token' },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('✅ Token validated, apiToken record created:', data);

      // Step 2: Fetch shops from Printify
      console.log('🚀 Step 2: Fetching shops from Printify...');
      
      const shopsWebhookUrl = 'https://n8n.srv874829.hstgr.cloud/webhook/list-shops';
      const shopsPayload = {
        userId,
        apiTokenId: data.id, // Send the apiToken ID that was just created
      };

      console.log('🏪 Calling list-shops webhook with payload:', shopsPayload);

      const shopsResponse = await fetch(shopsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopsPayload),
      });

      if (!shopsResponse.ok) {
        const errorText = await shopsResponse.text();
        console.error('❌ Failed to fetch shops:', errorText);
        return NextResponse.json(
          { error: 'Failed to fetch shops' },
          { status: shopsResponse.status }
        );
      }

      const shopsData = await shopsResponse.json();
      console.log('✅ Fetched shops:', shopsData.shops?.length || 0);

      // Return apiTokenId, tokenRef (for choose-shop endpoint), and shops
      return NextResponse.json({
        apiTokenId: data.id,
        tokenRef: apiToken, // The actual API token string
        shops: shopsData.shops || [],
      });
    } else if (provider === 'shopify') {
      // TODO: Implement Shopify validation
      return NextResponse.json(
        { error: 'Shopify provider not yet implemented' },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

