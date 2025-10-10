import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/user';

/**
 * GET /api/presets
 * Fetch all presets for the current user
 */
export async function GET() {
  try {
    const userId = getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`📦 Fetching presets for user: ${userId}`);

    // Fetch presets with blueprint and print_provider details
    const { data, error } = await supabaseAdmin
      .from('presets')
      .select(`
        *,
        blueprint:blueprints(id, title, brand, model, images),
        print_provider:print_providers(id, title, location)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presets', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} presets`);

    return NextResponse.json({ presets: data || [] });
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/presets
 * Create a new preset
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, blueprint_id, print_provider_id, placements } = body;

    // Validation
    if (!name || !blueprint_id || !print_provider_id || !placements) {
      return NextResponse.json(
        { error: 'Missing required fields: name, blueprint_id, print_provider_id, placements' },
        { status: 400 }
      );
    }

    console.log(`📦 Creating preset for user: ${userId}`);
    console.log(`   Name: ${name}`);
    console.log(`   Blueprint ID: ${blueprint_id}`);
    console.log(`   Print Provider ID: ${print_provider_id}`);

    const { data, error } = await supabaseAdmin
      .from('presets')
      .insert({
        user_id: userId,
        name,
        provider: 'printify', // Always printify for now
        blueprint_id,
        print_provider_id,
        visibility: 'private', // Always private for now
        placements,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create preset', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Preset created successfully: ${data.id}`);

    return NextResponse.json({ preset: data }, { status: 201 });
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/presets
 * Update an existing preset
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, name, blueprint_id, print_provider_id, placements } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    console.log(`📦 Updating preset: ${id} for user: ${userId}`);

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (blueprint_id !== undefined) updates.blueprint_id = blueprint_id;
    if (print_provider_id !== undefined) updates.print_provider_id = print_provider_id;
    if (placements !== undefined) updates.placements = placements;

    const { data, error } = await supabaseAdmin
      .from('presets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns this preset
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update preset', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Preset not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    console.log(`✅ Preset updated successfully: ${id}`);

    return NextResponse.json({ preset: data });
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/presets
 * Delete a preset
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting preset: ${id} for user: ${userId}`);

    const { error } = await supabaseAdmin
      .from('presets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure user owns this preset

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete preset', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Preset deleted successfully: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

