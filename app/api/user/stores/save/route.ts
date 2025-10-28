import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/user/stores/save
 * Saves a selected shop to the stores table
 * Body: { userId, provider, name, store_id, api_token_id, is_default }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, provider, name, store_id, api_token_id, is_default } = body;

    if (!userId || !provider || !name || !store_id || !api_token_id) {
      return NextResponse.json(
        { error: 'userId, provider, name, store_id, and api_token_id are required' },
        { status: 400 }
      );
    }

    console.log('💾 Saving shop:', name, 'for user:', userId);

    // Check if this is the first shop of this provider
    const { data: existingStores, error: checkError } = await supabaseAdmin
      .from('stores')
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
        .from('stores')
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
      .from('stores')
      .insert({
        user_id: userId,
        provider,
        name,
        store_id,
        api_token_id,
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

    console.log('✅ Shop saved successfully:', data.id);
    return NextResponse.json({ success: true, store: data });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

