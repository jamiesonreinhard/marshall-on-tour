import { NextResponse } from 'next/server';
import { searchTennisVideos, findMatchHighlights, findClassicMatches } from '@/lib/data/integrations/youtube';

/**
 * Debug endpoint to test YouTube API integration
 * GET /api/debug/youtube?test=search|highlights|classic&query=...
 * 
 * Examples:
 * - /api/debug/youtube?test=search&query=alcaraz%20djokovic
 * - /api/debug/youtube?test=highlights&player=Alcaraz&tournament=Wimbledon&year=2023
 * - /api/debug/youtube?test=classic&player=Federer
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const test = searchParams.get('test') || 'search';
    const query = searchParams.get('query') || 'tennis highlights';
    const player = searchParams.get('player') || 'Alcaraz';
    const tournament = searchParams.get('tournament') || 'Wimbledon';
    const year = parseInt(searchParams.get('year') || '2023');
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    const hasApiKey = !!apiKey;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'YOUTUBE_API_KEY not set',
        hasApiKey: false,
      });
    }
    
    let result: any = null;
    let directApiTest: any = null;
    
    switch (test) {
      case 'search': {
        result = await searchTennisVideos(query, 5);
        
        // Test direct API call
        try {
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&order=relevance&key=${apiKey}`;
          const searchResponse = await fetch(searchUrl, { cache: 'no-store' });
          const searchData = await searchResponse.json();
          
          directApiTest = {
            status: searchResponse.status,
            statusText: searchResponse.statusText,
            hasResults: searchData.items && searchData.items.length > 0,
            resultCount: searchData.items?.length || 0,
            error: searchData.error?.message,
          };
        } catch (e: any) {
          directApiTest = { error: e.message };
        }
        
        return NextResponse.json({
          success: result.success,
          hasApiKey: true,
          apiKeyPrefix: `${apiKey.substring(0, 4)}...`,
          test: 'search',
          query,
          result: result.data,
          source: result.source,
          directApiTest,
        });
      }
      
      case 'highlights': {
        result = await findMatchHighlights(player, tournament, year);
        
        // Test direct API call
        try {
          const searchQuery = `${player} ${tournament} ${year} highlights`;
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=5&order=relevance&key=${apiKey}`;
          const searchResponse = await fetch(searchUrl, { cache: 'no-store' });
          const searchData = await searchResponse.json();
          
          directApiTest = {
            status: searchResponse.status,
            statusText: searchResponse.statusText,
            hasResults: searchData.items && searchData.items.length > 0,
            resultCount: searchData.items?.length || 0,
            error: searchData.error?.message,
          };
        } catch (e: any) {
          directApiTest = { error: e.message };
        }
        
        return NextResponse.json({
          success: result.success,
          hasApiKey: true,
          apiKeyPrefix: `${apiKey.substring(0, 4)}...`,
          test: 'highlights',
          player,
          tournament,
          year,
          result: result.data,
          source: result.source,
          directApiTest,
        });
      }
      
      case 'classic': {
        result = await findClassicMatches(player, tournament);
        
        // Test direct API call
        try {
          let searchQuery = 'tennis classic match highlights';
          if (player) searchQuery = `${player} ${searchQuery}`;
          if (tournament) searchQuery = `${tournament} ${searchQuery}`;
          
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&order=relevance&key=${apiKey}`;
          const searchResponse = await fetch(searchUrl, { cache: 'no-store' });
          const searchData = await searchResponse.json();
          
          directApiTest = {
            status: searchResponse.status,
            statusText: searchResponse.statusText,
            hasResults: searchData.items && searchData.items.length > 0,
            resultCount: searchData.items?.length || 0,
            error: searchData.error?.message,
          };
        } catch (e: any) {
          directApiTest = { error: e.message };
        }
        
        return NextResponse.json({
          success: result.success,
          hasApiKey: true,
          apiKeyPrefix: `${apiKey.substring(0, 4)}...`,
          test: 'classic',
          player: player || null,
          tournament: tournament || null,
          result: result.data,
          source: result.source,
          directApiTest,
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Use: search, highlights, or classic',
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test YouTube API',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
