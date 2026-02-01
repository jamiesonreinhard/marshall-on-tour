/**
 * Data Integration Types
 * 
 * Shared types for all data integrations
 */

export interface DataSourceConfig {
  enabled: boolean;
  cacheDuration?: number; // Cache duration in seconds
  fallbackToMock?: boolean;
}

export interface DataSourceResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  cached: boolean;
  source: string;
}

/**
 * Tournament/match data
 */
export interface Match {
  id: string;
  tournament_id: string;
  tournament_name: string;
  round: string; // 'R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'
  scheduled_time: string; // ISO timestamp
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  player1: {
    id: string;
    name: string;
    rank?: number;
    seed?: number;
  };
  player2: {
    id: string;
    name: string;
    rank?: number;
    seed?: number;
  };
  score?: {
    sets: Array<{
      player1: number;
      player2: number;
    }>;
    current_set?: number;
  };
  winner?: 'player1' | 'player2';
  duration?: number; // minutes
}

export interface Player {
  id: string;
  name: string;
  country: string;
  rank?: number;
  age?: number;
  playing_style?: string;
  head_to_head?: Record<string, number>; // { opponent_id: wins }
}

/**
 * News data
 */
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  published_at: string;
  source: string;
  image_url?: string;
  tags?: string[];
}

/**
 * Weather data
 */
export interface WeatherData {
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  current: {
    temperature: number; // Celsius
    condition: string; // 'sunny', 'cloudy', 'rainy', etc.
    humidity: number; // percentage
    wind_speed: number; // km/h
  };
  forecast?: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitation_chance: number;
  }>;
  updated_at: string;
}

/**
 * Location data (Google Maps)
 */
export interface LocationPlace {
  id: string;
  name: string;
  type: 'hotel' | 'coffee' | 'restaurant' | 'attraction' | 'venue';
  address: string;
  coordinates: { lat: number; lng: number };
  distance_from_venue?: number; // meters
  rating?: number; // 1-5
  price_level?: number; // 1-4
  website?: string;
  phone?: string;
  opening_hours?: string[];
  affiliate_link?: string; // For hotels
}

export interface WalkingRoute {
  from: { name: string; coordinates: { lat: number; lng: number } };
  to: { name: string; coordinates: { lat: number; lng: number } };
  distance: number; // meters
  duration: number; // seconds
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
}

/**
 * YouTube data
 */
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  channel: string;
  published_at: string;
  duration: number; // seconds
  view_count?: number;
}

/**
 * Gear data
 */
export interface GearItem {
  id: string;
  name: string;
  type: 'racket' | 'shoes' | 'bag' | 'strings' | 'grip' | 'apparel';
  brand: string;
  model: string;
  specifications?: Record<string, any>;
  price?: number;
  affiliate_link?: string;
  review_url?: string;
}
