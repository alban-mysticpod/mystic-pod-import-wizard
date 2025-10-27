import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/user/tokens
 * Fetches user's API tokens (Printify, Shopify, etc.)
 * Query params: userId (optional, defaults to 'user_test'), provider (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_test';
    const provider = searchParams.get('provider'); // optional filter

    console.log('🔑 Fetching API tokens for:', userId, provider ? `(provider: ${provider})` : '');

    let query = supabaseAdmin
      .from('api_tokens')
      .select('id, provider, token_ref, name, is_default, created_at, last_used_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by provider if specified
    if (provider) {
      query = query.eq('provider', provider);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} tokens`);
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
 * PATCH /api/user/tokens
 * Updates an API token (name and/or token_ref)
 * Body: { tokenId, userId, name, token_ref }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenId, userId, name, token_ref, is_default } = body;

    if (!tokenId) {
      return NextResponse.json(
        { error: 'tokenId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('✏️ Updating token:', tokenId, 'for user:', userId);

    // If setting as default, we need to unset other defaults for the same provider
    if (is_default === true) {
      // First, get the provider of the token being updated
      const { data: tokenData, error: fetchError } = await supabaseAdmin
        .from('api_tokens')
        .select('provider')
        .eq('id', tokenId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !tokenData) {
        console.error('❌ Failed to fetch token provider:', fetchError);
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }

      console.log('🔄 Setting token as default, unsetting others for provider:', tokenData.provider);

      // Unset all other tokens of the same provider as non-default
      const { error: unsetError } = await supabaseAdmin
        .from('api_tokens')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('provider', tokenData.provider)
        .neq('id', tokenId);

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
    if (token_ref !== undefined) {
      updateData.token_ref = token_ref;
    }
    if (is_default !== undefined) {
      updateData.is_default = is_default;
    }

    const { error } = await supabaseAdmin
      .from('api_tokens')
      .update(updateData)
      .eq('id', tokenId)
      .eq('user_id', userId); // Security: only update user's own tokens

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Token updated successfully');
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
 * DELETE /api/user/tokens
 * Deletes a specific API token
 * Query params: tokenId, userId
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const userId = searchParams.get('userId');

    if (!tokenId) {
      return NextResponse.json(
        { error: 'tokenId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting token:', tokenId, 'for user:', userId);

    const { error } = await supabaseAdmin
      .from('api_tokens')
      .delete()
      .eq('id', tokenId)
      .eq('user_id', userId); // Security: only delete user's own tokens

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Token deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

