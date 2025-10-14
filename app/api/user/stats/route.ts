import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUserId } from '@/lib/user';

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('📊 Fetching user stats for:', userId);

    // 1. Récupérer les statistiques d'imports
    const { data: imports, error: importsError } = await supabaseAdmin
      .from('imports')
      .select('id, status, created_at')
      .eq('user_id', userId);

    if (importsError) {
      console.error('❌ Error fetching imports:', importsError);
      throw importsError;
    }

    // 2. Récupérer le nombre total de designs (assets)
    const { count: totalDesigns, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (assetsError) {
      console.error('❌ Error fetching assets count:', assetsError);
      throw assetsError;
    }

    // 3. Récupérer les événements récents pour l'activité
    const importIds = imports?.map(imp => imp.id) || [];
    let recentEvents = [];
    
    if (importIds.length > 0) {
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('import_events')
        .select('*')
        .in('import_id', importIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) {
        console.error('❌ Error fetching import events:', eventsError);
      } else {
        recentEvents = events || [];
      }
    }

    // Calculer les statistiques
    const totalImports = imports?.length || 0;
    const successfulImports = imports?.filter(imp => imp.status === 'completed').length || 0;
    const designsUploaded = totalDesigns || 0;

    const stats = {
      totalImports,
      successfulImports,
      designsUploaded,
      recentActivity: recentEvents.map(event => ({
        id: event.id,
        importId: event.import_id,
        eventType: event.event_type,
        message: event.message,
        severity: event.severity,
        createdAt: event.created_at,
      })),
    };

    console.log('✅ User stats fetched successfully:', {
      totalImports,
      successfulImports,
      designsUploaded,
      recentEventsCount: recentEvents.length,
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
