import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PUT /api/user/settings
 * Updates user settings in Supabase
 * Body: { userId, locale?, timezone?, default_shop_id?, default_preset_id? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId = 'user_test', 
      locale, 
      timezone, 
      default_shop_id, 
      default_preset_id 
    } = body;

    console.log('⚙️ Updating user settings for:', userId);

    // Upsert user settings (insert or update)
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert({
        user_id: userId,
        locale,
        timezone,
        default_shop_id,
        default_preset_id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ User settings updated successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

