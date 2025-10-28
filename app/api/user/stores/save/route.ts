import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to get the correct table name based on provider
function getStoreTable(provider: string): string {
  return provider === 'shopify' ? 'shopify_stores' : 'printify_shops';
}

/**
 * POST /api/user/stores/save
 * Saves a selected shop to the appropriate table (printify_shops or shopify_stores)
 * Body: { userId, provider, name, shop_id, api_token, is_default }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, provider, name, shop_id, api_token, is_default } = body;

    if (!userId || !provider || !name || !shop_id || !api_token) {
      return NextResponse.json(
        { error: 'userId, provider, name, shop_id, and api_token are required' },
        { status: 400 }
      );
    }

    console.log('💾 Saving shop:', name, 'for user:', userId, 'provider:', provider);

    const tableName = getStoreTable(provider);

    // Check if this is the first shop of this provider
    const { data: existingStores, error: checkError } = await supabaseAdmin
      .from(tableName)
      .select('id')
      .eq('user_id', userId)
      .eq('provider', provider);

    if (checkError) {
      console.error('❌ Failed to check existing stores:', checkError);
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      );
    }

    const isFirstShop = !existingStores || existingStores.length === 0;
    const shouldBeDefault = isFirstShop || is_default;

    console.log('ℹ️ First shop of provider:', isFirstShop);
    console.log('ℹ️ Will be set as default:', shouldBeDefault);

    // If setting as default, unset other defaults for the same provider
    if (shouldBeDefault) {
      console.log('🔄 Unsetting other defaults for provider:', provider);
      
      const { error: unsetError } = await supabaseAdmin
        .from(tableName)
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('provider', provider);

      if (unsetError) {
        console.error('❌ Failed to unset other defaults:', unsetError);
        // Continue anyway
      }
    }

    // Insert the new shop
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert({
        user_id: userId,
        provider,
        name,
        shop_id,
        api_token,
        is_default: shouldBeDefault,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to insert shop:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Shop saved successfully to', tableName, ':', data.id);
    return NextResponse.json({ success: true, store: data });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

