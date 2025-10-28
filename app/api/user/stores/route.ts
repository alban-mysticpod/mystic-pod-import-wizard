import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/user/stores
 * Fetches user's stores (Printify shops, Shopify stores, etc.)
 * Query params: userId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('🏪 Fetching stores for user:', userId);

    const { data, error } = await supabaseAdmin
      .from('stores')
      .select('id, name, provider, shop_id, api_token, is_default, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} stores`);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/stores
 * Deletes a specific store
 * If the store is default, automatically promotes another store of the same provider
 * Query params: storeId, userId
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const userId = searchParams.get('userId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting store:', storeId, 'for user:', userId);

    // First, check if this store is default
    const { data: storeData, error: fetchError } = await supabaseAdmin
      .from('stores')
      .select('provider, is_default')
      .eq('id', storeId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !storeData) {
      console.error('❌ Failed to fetch store:', fetchError);
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const wasDefault = storeData.is_default;
    const provider = storeData.provider;

    // Delete the store
    const { error: deleteError } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', storeId)
      .eq('user_id', userId); // Security: only delete user's own stores

    if (deleteError) {
      console.error('❌ Supabase error:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // If it was default, promote another store of the same provider
    if (wasDefault) {
      console.log('🔄 Store was default, promoting another store of provider:', provider);

      // Find another store of the same provider
      const { data: remainingStores, error: findError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', provider)
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('❌ Failed to find remaining stores:', findError);
        // Continue anyway, the store is already deleted
      } else if (remainingStores && remainingStores.length > 0) {
        const newDefaultStoreId = remainingStores[0].id;
        console.log('✨ Promoting store as new default:', newDefaultStoreId);

        const { error: updateError } = await supabaseAdmin
          .from('stores')
          .update({ is_default: true })
          .eq('id', newDefaultStoreId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Failed to promote new default:', updateError);
          // Continue anyway, the store is deleted
        } else {
          console.log('✅ New default store promoted successfully');
        }
      } else {
        console.log('ℹ️ No remaining stores of provider:', provider);
      }
    }

    console.log('✅ Store deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/stores
 * Updates a store (name and/or is_default)
 * Body: { storeId, userId, name?, is_default? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, userId, name, is_default } = body;

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('✏️ Updating store:', storeId, 'for user:', userId);

    // If setting as default, we need to unset other defaults for the same provider
    if (is_default === true) {
      // First, get the provider of the store being updated
      const { data: storeData, error: fetchError } = await supabaseAdmin
        .from('stores')
        .select('provider')
        .eq('id', storeId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !storeData) {
        console.error('❌ Failed to fetch store provider:', fetchError);
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        );
      }

      console.log('🔄 Setting store as default, unsetting others for provider:', storeData.provider);

      // Unset all other stores of the same provider as non-default
      const { error: unsetError } = await supabaseAdmin
        .from('stores')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('provider', storeData.provider)
        .neq('id', storeId);

      if (unsetError) {
        console.error('❌ Failed to unset other defaults:', unsetError);
        // Continue anyway, the main update should still work
      }
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (is_default !== undefined) {
      updateData.is_default = is_default;
    }

    const { error } = await supabaseAdmin
      .from('stores')
      .update(updateData)
      .eq('id', storeId)
      .eq('user_id', userId); // Security: only update user's own stores

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Store updated successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
