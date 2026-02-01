/**
 * Gear Data Integration
 * 
 * Manages gear information, reviews, and affiliate links
 * Can be manual database entries or scraped from gear sites
 */

import { GearItem, DataSourceResult, DataSourceConfig } from './types';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 86400, // 24 hours (gear doesn't change often)
  fallbackToMock: true,
};

/**
 * Get gear items by type
 */
export async function getGearItems(
  type?: GearItem['type'],
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<GearItem[]>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Gear integration is disabled',
      cached: false,
      source: 'gear',
    };
  }
  
  // TODO: Implement database query or API call
  // For now, return mock data
  
  if (config.fallbackToMock) {
    return {
      success: true,
      data: getMockGear(type),
      cached: false,
      source: 'gear-mock',
    };
  }
  
  return {
    success: false,
    data: null,
    error: 'Gear data not implemented yet',
    cached: false,
    source: 'gear',
  };
}

/**
 * Get gear item by name
 */
export async function getGearItem(
  name: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<GearItem>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'Gear integration is disabled',
      cached: false,
      source: 'gear',
    };
  }
  
  // TODO: Implement database query
  // For now, search mock data
  
  if (config.fallbackToMock) {
    const allGear = getMockGear();
    const item = allGear.find(g => 
      g.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (item) {
      return {
        success: true,
        data: item,
        cached: false,
        source: 'gear-mock',
      };
    }
  }
  
  return {
    success: false,
    data: null,
    error: `Gear item "${name}" not found`,
    cached: false,
    source: 'gear',
  };
}

/**
 * Mock gear data (fallback)
 */
function getMockGear(type?: GearItem['type']): GearItem[] {
  const allGear: GearItem[] = [
    {
      id: 'gear-racket-1',
      name: 'Wilson Blade 98',
      type: 'racket',
      brand: 'Wilson',
      model: 'Blade 98',
      specifications: {
        head_size: '98 sq in',
        weight: '305g',
        string_pattern: '18x20',
      },
      price: 249,
      affiliate_link: 'https://example.com/affiliate/wilson-blade-98',
    },
    {
      id: 'gear-shoes-1',
      name: 'Nike Court Vapor',
      type: 'shoes',
      brand: 'Nike',
      model: 'Court Vapor',
      specifications: {
        surface: 'Hard court',
        cushioning: 'Zoom Air',
      },
      price: 130,
      affiliate_link: 'https://example.com/affiliate/nike-vapor',
    },
    {
      id: 'gear-bag-1',
      name: 'Babolat Pure Drive Bag',
      type: 'bag',
      brand: 'Babolat',
      model: 'Pure Drive',
      price: 89,
      affiliate_link: 'https://example.com/affiliate/babolat-bag',
    },
  ];
  
  if (type) {
    return allGear.filter(g => g.type === type);
  }
  
  return allGear;
}
