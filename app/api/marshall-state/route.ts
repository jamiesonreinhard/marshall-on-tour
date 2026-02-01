import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { getMarshallState, updateMarshallState } from '@/lib/marshall/state';

/**
 * Get Marshall's current state
 * GET /api/marshall-state
 */
export async function GET() {
  try {
    const state = await getMarshallState();
    
    return NextResponse.json({
      success: true,
      state: state || null,
    });
  } catch (error: any) {
    console.error('Error fetching Marshall state:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Marshall state',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Update Marshall's state
 * PATCH /api/marshall-state
 */
export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();
    
    const updatedState = await updateMarshallState(updates, 'manual');
    
    if (!updatedState) {
      return NextResponse.json(
        { error: 'Failed to update state' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      state: updatedState,
    });
  } catch (error: any) {
    console.error('Error updating Marshall state:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update Marshall state',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
