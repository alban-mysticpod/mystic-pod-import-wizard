import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/user/profile
 * Fetches user profile from Supabase
 * Query params: userId (optional, defaults to 'user_test')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_test';

    console.log('🔍 Fetching user profile for:', userId);

    // Query Supabase with SERVICE_ROLE_KEY (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_settings(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('⚠️ User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ User profile fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Updates user profile in Supabase
 * Body: { userId, display_name?, email?, avatar_url? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'user_test', display_name, email, avatar_url } = body;

    console.log('📝 Updating user profile for:', userId);

    // Update user in Supabase
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        display_name,
        email,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ User profile updated successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

