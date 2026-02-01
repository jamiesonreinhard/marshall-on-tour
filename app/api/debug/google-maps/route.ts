import { NextResponse } from 'next/server';
import { findPlacesNearby, geocodeLocation, getWalkingRoute } from '@/lib/data/integrations/google-maps';

/**
 * Debug endpoint to test Google Maps API integration
 * GET /api/debug/google-maps?test=geocode|places|route
 * 
 * Examples:
 * - /api/debug/google-maps?test=geocode&city=Melbourne&country=Australia
 * - /api/debug/google-maps?test=places&lat=-37.814&lng=144.963&type=hotel
 * - /api/debug/google-maps?test=route&from_lat=-37.814&from_lng=144.963&to_lat=-37.815&to_lng=144.964
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const test = searchParams.get('test') || 'geocode';
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const hasApiKey = !!apiKey;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GOOGLE_MAPS_API_KEY not set',
        hasApiKey: false,
      });
    }
    
    let result: any = null;
    let directApiTest: any = null;
    
    switch (test) {
      case 'geocode': {
        const city = searchParams.get('city') || 'Melbourne';
        const country = searchParams.get('country') || 'Australia';
        
        result = await geocodeLocation(city, country);
        
        // Test direct API call
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)},${encodeURIComponent(country)}&key=${apiKey}`;
          const geocodeResponse = await fetch(geocodeUrl, { cache: 'no-store' });
          const geocodeData = await geocodeResponse.json();
          
          directApiTest = {
            status: geocodeResponse.status,
            statusText: geocodeResponse.statusText,
            hasResults: geocodeData.status === 'OK' && geocodeData.results?.length > 0,
            statusCode: geocodeData.status,
            location: geocodeData.results?.[0]?.geometry?.location,
          };
        } catch (e: any) {
          directApiTest = { error: e.message };
        }
        
        return NextResponse.json({
          success: !!result.success && !!result.data,
          hasApiKey: true,
          apiKeyPrefix: `${apiKey.substring(0, 4)}...`,
          test: 'geocode',
          location: { city, country },
          result: result.data,
          source: result.source,
          directApiTest,
        });
      }
      
      case 'places': {
        const lat = parseFloat(searchParams.get('lat') || '-37.814');
        const lng = parseFloat(searchParams.get('lng') || '144.963');
        const type = (searchParams.get('type') || 'hotel') as 'hotel' | 'coffee' | 'restaurant' | 'attraction';
        
        result = await findPlacesNearby({ lat, lng }, type, 5000, 5);
        
        // Test direct API call
        try {
          const placeTypeMap: Record<string, string> = {
            hotel: 'lodging',
            coffee: 'cafe',
            restaurant: 'restaurant',
            attraction: 'tourist_attraction',
          };
          
          const googleType = placeTypeMap[type] || 'establishment';
          const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${googleType}&key=${apiKey}`;
          const placesResponse = await fetch(placesUrl, { cache: 'no-store' });
          const placesData = await placesResponse.json();
          
          directApiTest = {
            status: placesResponse.status,
            statusText: placesResponse.statusText,
            hasResults: placesData.status === 'OK' && placesData.results?.length > 0,
            statusCode: placesData.status,
            resultCount: placesData.results?.length || 0,
          };
        } catch (e: any) {
          directApiTest = { error: e.message };
        }
        
        return NextResponse.json({
          success: result.success,
          hasApiKey: true,
          apiKeyPrefix: `${apiKey.substring(0, 4)}...`,
          test: 'places',
          location: { lat, lng },
          type,
          result: result.data,
          source: result.source,
          directApiTest,
        });
      }
      
      case 'route': {
        const fromLat = parseFloat(searchParams.get('from_lat') || '-37.814');
        const fromLng = parseFloat(searchParams.get('from_lng') || '144.963');
        const toLat = parseFloat(searchParams.get('to_lat') || '-37.815');
        const toLng = parseFloat(searchParams.get('to_lng') || '144.964');
        
        result = await getWalkingRoute(
          { lat: fromLat, lng: fromLng, name: 'Origin' },
          { lat: toLat, lng: toLng, name: 'Destination' }
        );
        
        // Test direct API call
        try {
          const routeUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&mode=walking&key=${apiKey}`;
          const routeResponse = await fetch(routeUrl, { cache: 'no-store' });
          const routeData = await routeResponse.json();
          
          directApiTest = {
            status: routeResponse.status,
            statusText: routeResponse.statusText,
            hasRoute: routeData.status === 'OK' && routeData.routes?.length > 0,
            statusCode: routeData.status,
            distance: routeData.routes?.[0]?.legs?.[0]?.distance?.text,
            duration: routeData.routes?.[0]?.legs?.[0]?.duration?.text,
          };
        } catch (e: any) {
          directApiTest = { error: e.message };
        }
        
        return NextResponse.json({
          success: result.success,
          hasApiKey: true,
          apiKeyPrefix: `${apiKey.substring(0, 4)}...`,
          test: 'route',
          from: { lat: fromLat, lng: fromLng },
          to: { lat: toLat, lng: toLng },
          result: result.data,
          source: result.source,
          directApiTest,
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Use: geocode, places, or route',
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test Google Maps API',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
