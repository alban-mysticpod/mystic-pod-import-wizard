import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/print-areas
 * Fetch print areas for a specific print provider
 * Query params: print_provider_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const printProviderId = searchParams.get('print_provider_id');

    if (!printProviderId) {
      return NextResponse.json(
        { error: 'print_provider_id is required' },
        { status: 400 }
      );
    }

    console.log(`📦 Fetching print areas for print_provider_id: ${printProviderId}`);

    const { data, error } = await supabaseAdmin
      .from('print_areas')
      .select('*')
      .eq('print_provider_id', printProviderId)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch print areas', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} print areas`);

    return NextResponse.json({ printAreas: data || [] });
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

