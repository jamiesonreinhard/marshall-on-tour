/**
 * API Costs Endpoint
 * 
 * GET /api/costs - Get cost summary
 */

import { NextResponse } from 'next/server';
import { getWeeklyCosts, getDailyCosts, getCurrentWeekTotal } from '@/lib/costs/tracker';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const days = parseInt(searchParams.get('days') || '7');
    
    if (period === 'week') {
      const weeklyCosts = await getWeeklyCosts();
      const total = await getCurrentWeekTotal();
      
      return NextResponse.json({
        period: 'week',
        total_cost: total,
        services: weeklyCosts,
        budget_limit: 20, // $20/week
        budget_remaining: Math.max(0, 20 - total),
        budget_percentage: (total / 20) * 100,
      });
    } else {
      const dailyCosts = await getDailyCosts(days);
      const total = dailyCosts.reduce((sum, item) => sum + Number(item.total_cost), 0);
      
      return NextResponse.json({
        period: 'daily',
        days,
        total_cost: total,
        daily_breakdown: dailyCosts,
        budget_limit: 20, // $20/week
        budget_remaining: Math.max(0, 20 - total),
        budget_percentage: (total / 20) * 100,
      });
    }
  } catch (error: any) {
    console.error('Error fetching costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch costs', details: error.message },
      { status: 500 }
    );
  }
}
