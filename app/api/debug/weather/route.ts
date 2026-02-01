import { NextResponse } from 'next/server';
import { fetchWeather, getTournamentWeather } from '@/lib/data/integrations/weather';

/**
 * Debug endpoint to test Weather API integration (Open-Meteo)
 * GET /api/debug/weather?city=Melbourne&country=Australia
 * 
 * Open-Meteo is free and requires no API key!
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Melbourne';
    const country = searchParams.get('country') || 'Australia';
    
    // Test fetching weather
    const result = await fetchWeather(city, country);
    
    // Also test direct API call to verify it works
    let directApiTest: any = null;
    try {
      // Test geocoding (different base URL)
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&count=1`;
      const geocodeResponse = await fetch(geocodeUrl, { cache: 'no-store' });
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.results && geocodeData.results.length > 0) {
        const coords = geocodeData.results[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl, { cache: 'no-store' });
        const weatherData = await weatherResponse.json();
        
        directApiTest = {
          geocoding: {
            success: true,
            coordinates: { lat: coords.latitude, lng: coords.longitude },
            city: coords.name,
            country: coords.country,
          },
          weather: {
            success: weatherResponse.ok,
            hasData: !!weatherData.current_weather,
            temperature: weatherData.current_weather?.temperature,
            condition: weatherData.current_weather?.weathercode,
          },
        };
      } else {
        directApiTest = {
          geocoding: {
            success: false,
            error: 'No results found',
          },
        };
      }
    } catch (e: any) {
      directApiTest = { error: e.message };
    }
    
    return NextResponse.json({
      success: result.success,
      apiProvider: 'Open-Meteo (free, no API key required)',
      location: { city, country },
      weather: result.data,
      source: result.source,
      cached: result.cached,
      error: result.error,
      directApiTest,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test Weather API',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
