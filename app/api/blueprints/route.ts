import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/blueprints
 * Fetches available blueprints (product templates)
 * Query params: provider (optional, defaults to 'printify')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'printify';

    console.log('📦 Fetching blueprints for provider:', provider);

    const { data, error } = await supabaseAdmin
      .from('blueprints')
      .select('id, provider, title, brand, model, description, images, created_at')
      .eq('provider', provider)
      .order('title', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} blueprints`);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

