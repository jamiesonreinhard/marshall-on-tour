import { NextResponse } from 'next/server';

/**
 * Debug endpoint to list available Gemini models
 * 
 * GET /api/debug/gemini-models
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not set' },
      { status: 400 }
    );
  }

  try {
    // Try to list models from v1 API
    const v1Response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
    );

    let v1Models = null;
    if (v1Response.ok) {
      const v1Data = await v1Response.json();
      v1Models = v1Data.models?.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        supportedGenerationMethods: m.supportedGenerationMethods,
      })) || [];
    }

    // Try v1beta API
    const v1betaResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    let v1betaModels = null;
    if (v1betaResponse.ok) {
      const v1betaData = await v1betaResponse.json();
      v1betaModels = v1betaData.models?.map((m: any) => ({
        name: m.name,
        displayName: m.displayName,
        supportedGenerationMethods: m.supportedGenerationMethods,
      })) || [];
    }

    return NextResponse.json({
      v1: {
        status: v1Response.status,
        models: v1Models,
        error: v1Response.ok ? null : await v1Response.text(),
      },
      v1beta: {
        status: v1betaResponse.status,
        models: v1betaModels,
        error: v1betaResponse.ok ? null : await v1betaResponse.text(),
      },
      recommendation: v1Models?.length > 0 
        ? `Use v1 API with models: ${v1Models.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent')).map((m: any) => m.name).join(', ')}`
        : v1betaModels?.length > 0
        ? `Use v1beta API with models: ${v1betaModels.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent')).map((m: any) => m.name).join(', ')}`
        : 'No models found. Check API key permissions.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch models',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
