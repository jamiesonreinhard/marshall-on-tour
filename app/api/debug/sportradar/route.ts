import { NextResponse } from 'next/server';

/**
 * Debug endpoint to test Sportradar API connection directly
 * Based on Postman collection and v3 API documentation
 * GET /api/debug/sportradar
 */
export async function GET() {
  try {
    const apiKey = process.env.SPORTRADAR_API_KEY;
    const hasApiKey = !!apiKey;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'SPORTRADAR_API_KEY not set',
        hasApiKey: false,
      });
    }

    // Test different Sportradar endpoint structures and auth methods
    // Some APIs use header-based auth instead of query params
    const endpoints = [
      // Query param auth (current method)
      { 
        name: 'Competitions (Query Param Auth)', 
        url: `https://api.sportradar.com/tennis/trial/v3/en/competitions.json?api_key=${apiKey}`,
        headers: { 'Accept': 'application/json' },
      },
      { 
        name: 'Competitions (No .json)', 
        url: `https://api.sportradar.com/tennis/trial/v3/en/competitions?api_key=${apiKey}`,
        headers: { 'Accept': 'application/json' },
      },
      // Header-based auth (common in newer APIs)
      { 
        name: 'Competitions (Header Auth)', 
        url: `https://api.sportradar.com/tennis/trial/v3/en/competitions.json`,
        headers: { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      },
      { 
        name: 'Competitions (X-API-Key Header)', 
        url: `https://api.sportradar.com/tennis/trial/v3/en/competitions.json`,
        headers: { 
          'Accept': 'application/json',
          'X-API-Key': apiKey,
        },
      },
      { 
        name: 'Competitions (api_key Header)', 
        url: `https://api.sportradar.com/tennis/trial/v3/en/competitions.json`,
        headers: { 
          'Accept': 'application/json',
          'api_key': apiKey,
        },
      },
      // Try different base URLs
      { 
        name: 'Competitions (Different Base)', 
        url: `https://api.sportradar.com/tennis/v3/en/competitions.json?api_key=${apiKey}`,
        headers: { 'Accept': 'application/json' },
      },
      // Try seasons endpoint
      { 
        name: 'Seasons (Query Param)', 
        url: `https://api.sportradar.com/tennis/trial/v3/en/seasons.json?api_key=${apiKey}`,
        headers: { 'Accept': 'application/json' },
      },
      // Try daily summaries with date
      { 
        name: 'Daily Summaries (Today)', 
        url: `https://api.sportradar.com/tennis/trial/v3/en/sport_events/daily_summaries/${new Date().toISOString().split('T')[0]}.json?api_key=${apiKey}`,
        headers: { 'Accept': 'application/json' },
      },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.name}:`, endpoint.url.replace(apiKey, '***'));
        
        // Filter out undefined values from headers
        const headers: Record<string, string> = {};
        if (endpoint.headers) {
          for (const [key, value] of Object.entries(endpoint.headers)) {
            if (value !== undefined) {
              headers[key] = value;
            }
          }
        }
        if (!headers['Accept']) {
          headers['Accept'] = 'application/json';
        }
        
        const response = await fetch(endpoint.url, {
          cache: 'no-store',
          headers,
        });

        const status = response.status;
        let responseData: any = null;
        let errorText = '';

        try {
          const text = await response.text();
          try {
            responseData = JSON.parse(text);
          } catch {
            errorText = text.substring(0, 500); // First 500 chars
          }
        } catch (e) {
          errorText = 'Could not parse response';
        }

        results.push({
          name: endpoint.name,
          url: endpoint.url.replace(apiKey, '***'),
          authMethod: endpoint.headers?.Authorization ? 'Header' : 'Query Param',
          status,
          statusText: response.statusText,
          success: status === 200,
          hasData: !!responseData,
          dataKeys: responseData ? Object.keys(responseData) : null,
          dataSample: responseData ? (
            responseData.competitions || 
            responseData.seasons || 
            responseData.sport_events || 
            responseData
          )?.slice(0, 2) : null,
          error: errorText || undefined,
        });

        // If we found a working endpoint, stop here
        if (status === 200 && responseData) {
          break;
        }
      } catch (error: any) {
        results.push({
          name: endpoint.name,
          url: endpoint.url.replace(apiKey, '***'),
          error: error.message,
        });
      }
    }

    const workingEndpoint = results.find(r => r.success);

    return NextResponse.json({
      success: !!workingEndpoint,
      hasApiKey: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: `${apiKey.substring(0, 4)}...`,
      endpointTests: results,
      recommendation: workingEndpoint
        ? `✅ Use endpoint: ${workingEndpoint.name} with ${workingEndpoint.authMethod} authentication`
        : '❌ None of the tested endpoints worked. Possible issues:\n' +
          '1. API key may be expired or invalid\n' +
          '2. API key may not have access to Tennis API\n' +
          '3. Trial subscription may have ended\n' +
          '4. Check your Sportradar dashboard for correct endpoint format\n' +
          '5. Verify the API key is for Tennis API, not a different product',
      workingEndpoint: workingEndpoint ? {
        name: workingEndpoint.name,
        url: workingEndpoint.url,
        authMethod: workingEndpoint.authMethod,
        dataStructure: workingEndpoint.dataKeys,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test Sportradar API', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}