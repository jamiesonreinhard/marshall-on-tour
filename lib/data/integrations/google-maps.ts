/**
 * Google Maps API Integration
 * 
 * Finds hotels, coffee shops, restaurants, and walking routes near tournament venues
 * Uses Google Maps Places API and Directions API
 */

import { LocationPlace, WalkingRoute, DataSourceResult, DataSourceConfig } from './types';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 86400, // 24 hours (locations don't change often)
  fallbackToMock: true,
};

const GOOGLE_MAPS_API_BASE = 'https://maps.googleapis.com/maps/api';

/**
 * Find places near a location
 */
export async function findPlacesNearby(
  location: { lat: number; lng: number },
  type: 'hotel' | 'coffee' | 'restaurant' | 'attraction',
  radius: number = 5000, // meters
  maxResults: number = 10,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<LocationPlace[]>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Google Maps integration is disabled',
      cached: false,
      source: 'google-maps',
    };
  }
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not set. Using mock data.');
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockPlaces(type),
        cached: false,
        source: 'google-maps-mock',
      };
    }
    return {
      success: false,
      data: null,
      error: 'GOOGLE_MAPS_API_KEY not set',
      cached: false,
      source: 'google-maps',
    };
  }
  
  try {
    // Map our types to Google Places types
    const placeTypeMap: Record<string, string> = {
      hotel: 'lodging',
      coffee: 'cafe',
      restaurant: 'restaurant',
      attraction: 'tourist_attraction',
    };
    
    const googleType = placeTypeMap[type] || 'establishment';
    
    const url = `${GOOGLE_MAPS_API_BASE}/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${googleType}&key=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: config.cacheDuration || 86400 },
    });
    
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Track API costs
    try {
      const { logCost, calculateGoogleMapsCost } = await import('@/lib/costs/tracker');
      const cost = calculateGoogleMapsCost('directions', 1);
      
      await logCost({
        service: 'google-maps',
        endpoint: 'directions',
        cost_usd: cost,
        request_count: 1,
        metadata: {
          from: `${from.lat},${from.lng}`,
          to: `${to.lat},${to.lng}`,
        },
      });
    } catch (costError) {
      console.warn('Failed to track Google Maps cost:', costError);
    }
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }
    
    // Track API costs
    try {
      const { logCost, calculateGoogleMapsCost } = await import('@/lib/costs/tracker');
      const cost = calculateGoogleMapsCost('nearbysearch', 1);
      
      await logCost({
        service: 'google-maps',
        endpoint: 'nearbysearch',
        cost_usd: cost,
        request_count: 1,
        metadata: {
          type,
          location: `${location.lat},${location.lng}`,
          radius,
        },
      });
    } catch (costError) {
      console.warn('Failed to track Google Maps cost:', costError);
    }
    
    const places: LocationPlace[] = (data.results || [])
      .slice(0, maxResults)
      .map((place: any) => ({
        id: place.place_id,
        name: place.name,
        type,
        address: place.vicinity || place.formatted_address,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        rating: place.rating,
        price_level: place.price_level,
        website: place.website,
        phone: place.international_phone_number,
        opening_hours: place.opening_hours?.weekday_text,
      }));
    
    return {
      success: true,
      data: places,
      cached: false,
      source: 'google-maps',
    };
  } catch (error: any) {
    console.error('Error fetching places from Google Maps:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockPlaces(type),
        cached: false,
        source: 'google-maps-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'google-maps',
    };
  }
}

/**
 * Get walking route between two points
 */
export async function getWalkingRoute(
  from: { lat: number; lng: number; name?: string },
  to: { lat: number; lng: number; name?: string },
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<WalkingRoute>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Google Maps integration is disabled',
      cached: false,
      source: 'google-maps',
    };
  }
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not set. Using mock data.');
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockWalkingRoute(from, to),
        cached: false,
        source: 'google-maps-mock',
      };
    }
    return {
      success: false,
      data: null,
      error: 'GOOGLE_MAPS_API_KEY not set',
      cached: false,
      source: 'google-maps',
    };
  }
  
  try {
    const url = `${GOOGLE_MAPS_API_BASE}/directions/json?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&mode=walking&key=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: config.cacheDuration || 86400 },
    });
    
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Track API costs
    try {
      const { logCost, calculateGoogleMapsCost } = await import('@/lib/costs/tracker');
      const cost = calculateGoogleMapsCost('directions', 1);
      
      await logCost({
        service: 'google-maps',
        endpoint: 'directions',
        cost_usd: cost,
        request_count: 1,
        metadata: {
          from: `${from.lat},${from.lng}`,
          to: `${to.lat},${to.lng}`,
        },
      });
    } catch (costError) {
      console.warn('Failed to track Google Maps cost:', costError);
    }
    
    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }
    
    const route = data.routes[0];
    const leg = route.legs[0];
    
    const walkingRoute: WalkingRoute = {
      from: {
        name: from.name || 'Origin',
        coordinates: from,
      },
      to: {
        name: to.name || 'Destination',
        coordinates: to,
      },
      distance: leg.distance.value, // meters
      duration: leg.duration.value, // seconds
      steps: leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML
        distance: step.distance.value,
        duration: step.duration.value,
      })),
    };
    
    return {
      success: true,
      data: walkingRoute,
      cached: false,
      source: 'google-maps',
    };
  } catch (error: any) {
    console.error('Error fetching walking route:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockWalkingRoute(from, to),
        cached: false,
        source: 'google-maps-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'google-maps',
    };
  }
}

/**
 * Geocode a location (city, country) to coordinates
 */
export async function geocodeLocation(
  city: string,
  country: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<{ lat: number; lng: number }>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Google Maps integration is disabled',
      cached: false,
      source: 'google-maps',
    };
  }
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    if (config.fallbackToMock) {
      return {
        success: true,
        data: { lat: 0, lng: 0 }, // Mock coordinates
        cached: false,
        source: 'google-maps-mock',
      };
    }
    return {
      success: false,
      data: null,
      error: 'GOOGLE_MAPS_API_KEY not set',
      cached: false,
      source: 'google-maps',
    };
  }
  
  try {
    const url = `${GOOGLE_MAPS_API_BASE}/geocode/json?address=${encodeURIComponent(city)},${encodeURIComponent(country)}&key=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache geocoding for 24 hours
    });
    
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Track API costs
    try {
      const { logCost, calculateGoogleMapsCost } = await import('@/lib/costs/tracker');
      const cost = calculateGoogleMapsCost('directions', 1);
      
      await logCost({
        service: 'google-maps',
        endpoint: 'directions',
        cost_usd: cost,
        request_count: 1,
        metadata: {
          from: `${from.lat},${from.lng}`,
          to: `${to.lat},${to.lng}`,
        },
      });
    } catch (costError) {
      console.warn('Failed to track Google Maps cost:', costError);
    }
    
    if (data.status !== 'OK' || !data.results[0]) {
      throw new Error(`Google Maps API error: ${data.status}`);
    }
    
    const location = data.results[0].geometry.location;
    
    return {
      success: true,
      data: { lat: location.lat, lng: location.lng },
      cached: false,
      source: 'google-maps',
    };
  } catch (error: any) {
    console.error('Error geocoding location:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: { lat: 0, lng: 0 },
        cached: false,
        source: 'google-maps-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'google-maps',
    };
  }
}

/**
 * Mock data (fallback)
 */
function getMockPlaces(type: LocationPlace['type']): LocationPlace[] {
  const mockPlaces: Record<LocationPlace['type'], LocationPlace[]> = {
    hotel: [
      {
        id: 'mock-hotel-1',
        name: 'Grand Hotel',
        type: 'hotel',
        address: '123 Main St',
        coordinates: { lat: 0, lng: 0 },
        rating: 4.5,
        price_level: 3,
        affiliate_link: 'https://booking.com/hotel/123',
      },
    ],
    coffee: [
      {
        id: 'mock-coffee-1',
        name: 'Perfect Espresso',
        type: 'coffee',
        address: '456 Coffee Ave',
        coordinates: { lat: 0, lng: 0 },
        rating: 4.8,
      },
    ],
    restaurant: [
      {
        id: 'mock-restaurant-1',
        name: 'The Tennis Club Restaurant',
        type: 'restaurant',
        address: '789 Food Blvd',
        coordinates: { lat: 0, lng: 0 },
        rating: 4.3,
        price_level: 2,
      },
    ],
    attraction: [
      {
        id: 'mock-attraction-1',
        name: 'Tennis Museum',
        type: 'attraction',
        address: '321 Museum Way',
        coordinates: { lat: 0, lng: 0 },
        rating: 4.6,
      },
    ],
  };
  
  return mockPlaces[type] || [];
}

function getMockWalkingRoute(
  from: { lat: number; lng: number; name?: string },
  to: { lat: number; lng: number; name?: string }
): WalkingRoute {
  return {
    from: {
      name: from.name || 'Origin',
      coordinates: from,
    },
    to: {
      name: to.name || 'Destination',
      coordinates: to,
    },
    distance: 1500, // 1.5 km
    duration: 1200, // 20 minutes
    steps: [
      {
        instruction: 'Head north on Main Street',
        distance: 500,
        duration: 400,
      },
      {
        instruction: 'Turn right on Tennis Avenue',
        distance: 1000,
        duration: 800,
      },
    ],
  };
}
