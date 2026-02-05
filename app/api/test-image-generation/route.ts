import { NextRequest, NextResponse } from 'next/server';
import { generatePostImage } from '@/lib/ai/images';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      scene, 
      postType = 'lifestyle',
      topic = 'Test image generation',
      includeMarshall = true 
    } = body;

    if (!scene) {
      return NextResponse.json(
        { error: 'Scene description is required' },
        { status: 400 }
      );
    }

    console.log('[Test Image Generation] Generating image with scene:', scene);

    const imageUrl = await generatePostImage({
      postType: postType as 'gear' | 'travel' | 'analysis' | 'lifestyle',
      topic,
      includeMarshall,
      scene, // Custom scene description
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      scene,
    });
  } catch (error: any) {
    console.error('[Test Image Generation] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate image' 
      },
      { status: 500 }
    );
  }
}
