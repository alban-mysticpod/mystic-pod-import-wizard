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
      .select('id, provider, token_ref, name, created_at, last_used_at')
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

