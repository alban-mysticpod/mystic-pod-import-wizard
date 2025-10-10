import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/print-providers
 * Fetches print providers for a specific blueprint
 * Query params: blueprintId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('blueprintId');

    if (!blueprintId) {
      return NextResponse.json(
        { error: 'blueprintId is required' },
        { status: 400 }
      );
    }

    console.log('🖨️ Fetching print providers for blueprint:', blueprintId);

    const { data, error } = await supabaseAdmin
      .from('print_providers')
      .select('id, blueprint_id, title, location, provider, created_at')
      .eq('blueprint_id', parseInt(blueprintId))
      .order('title', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} print providers`);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

