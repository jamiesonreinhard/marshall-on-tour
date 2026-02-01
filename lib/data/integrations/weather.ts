/**
 * Weather API Integration
 * 
 * Fetches weather data for tournament locations
 * Uses Open-Meteo API (free, no API key required)
 * Documentation: https://open-meteo.com/en/docs
 */

import { WeatherData, DataSourceResult, DataSourceConfig } from './types';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 21600, // 6 hours (weather doesn't change that often)
  fallbackToMock: true,
};

const OPEN_METEO_API_BASE = 'https://api.open-meteo.com/v1';

/**
 * Geocode city/country to coordinates using Open-Meteo Geocoding API
 * Note: Geocoding API is at a different base URL
 */
async function geocodeLocation(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Open-Meteo geocoding API is at a different base URL
    let geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    if (country) {
      geocodeUrl += `&country=${encodeURIComponent(country)}`;
    }
    
    const response = await fetch(geocodeUrl, {
      next: { revalidate: 86400 }, // Cache geocoding for 24 hours
    });
    
    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return {
        lat: data.results[0].latitude,
        lng: data.results[0].longitude,
      };
    }
    
    // If no results with country, try without country filter
    if (country) {
      const cityOnlyUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      const cityResponse = await fetch(cityOnlyUrl, {
        next: { revalidate: 86400 },
      });
      
      if (cityResponse.ok) {
        const cityData = await cityResponse.json();
        if (cityData.results && cityData.results.length > 0) {
          return {
            lat: cityData.results[0].latitude,
            lng: cityData.results[0].longitude,
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
}

/**
 * Map WMO weather code to condition string
 */
function mapWeatherCode(code: number): string {
  // WMO Weather interpretation codes
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'partly-cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 85 && code <= 86) return 'snowy';
  if (code >= 95 && code <= 99) return 'stormy';
  return 'unknown';
}

/**
 * Fetch current weather for a location
 */
export async function fetchWeather(
  city: string,
  country: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<WeatherData>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Weather integration is disabled',
      cached: false,
      source: 'weather',
    };
  }
  
  try {
    // First, geocode the city/country to get coordinates
    const coords = await geocodeLocation(city, country);
    
    if (!coords) {
      throw new Error(`Could not find coordinates for ${city}, ${country}`);
    }
    
    // Fetch current weather from Open-Meteo
    // Include daily forecast for 7-day forecast
    const weatherUrl = `${OPEN_METEO_API_BASE}/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=7`;
    
    const weatherResponse = await fetch(weatherUrl, {
      next: { revalidate: config.cacheDuration || 21600 },
    });
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const data = await weatherResponse.json();
    
    // Get current weather data
    const current = data.current_weather;
    const hourly = data.hourly;
    
    // Get current hour index for humidity
    const now = new Date();
    const currentHour = now.getHours();
    let humidity: number | undefined;
    if (hourly && hourly.time && hourly.relativehumidity_2m) {
      const timeIndex = hourly.time.findIndex((t: string) => {
        const hour = new Date(t).getHours();
        return hour === currentHour;
      });
      if (timeIndex >= 0) {
        humidity = Math.round(hourly.relativehumidity_2m[timeIndex]);
      }
    }
    
    const weatherData: WeatherData = {
      location: {
        city,
        country,
        coordinates: { lat: coords.lat, lng: coords.lng },
      },
      current: {
        temperature: Math.round(current.temperature),
        condition: mapWeatherCode(current.weathercode),
        humidity: humidity,
        wind_speed: Math.round(current.windspeed * 3.6), // Convert m/s to km/h
      },
      updated_at: new Date().toISOString(),
    };
    
    // Add forecast if available (next 7 days)
    if (data.daily && data.daily.time) {
      weatherData.forecast = data.daily.time.slice(0, 7).map((date: string, idx: number) => ({
        date,
        high: Math.round(data.daily.temperature_2m_max[idx]),
        low: Math.round(data.daily.temperature_2m_min[idx]),
        condition: mapWeatherCode(data.daily.weathercode[idx]),
        precipitation_chance: data.daily.precipitation_probability_max ? Math.round(data.daily.precipitation_probability_max[idx]) : undefined,
      }));
    }
    
    return {
      success: true,
      data: weatherData,
      cached: false,
      source: 'weather',
    };
  } catch (error: any) {
    console.error('Error fetching weather:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockWeather(city, country),
        cached: false,
        source: 'weather-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'weather',
    };
  }
}

/**
 * Get weather for tournament location
 */
export async function getTournamentWeather(
  tournamentLocation: { city: string; country: string },
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<WeatherData>> {
  return fetchWeather(tournamentLocation.city, tournamentLocation.country, config);
}

/**
 * Mock weather data (fallback)
 */
function getMockWeather(city: string, country: string): WeatherData {
  return {
    location: {
      city,
      country,
    },
    current: {
      temperature: 22,
      condition: 'sunny',
      humidity: 65,
      wind_speed: 15,
    },
    updated_at: new Date().toISOString(),
  };
}
