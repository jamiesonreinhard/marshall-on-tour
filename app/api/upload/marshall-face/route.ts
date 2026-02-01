/**
 * API endpoint to upload Marshall's face reference image
 * 
 * POST /api/upload/marshall-face
 * Body: FormData with 'image' file
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToStorage, ensureBucketExists } from '@/lib/storage/upload-image';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }
    
    // Ensure bucket exists
    const bucketExists = await ensureBucketExists('marshall-assets');
    if (!bucketExists) {
      return NextResponse.json(
        { error: 'Failed to create storage bucket. Check Supabase permissions.' },
        { status: 500 }
      );
    }
    
    // Upload image
    const filename = `marshall-face-reference.${file.name.split('.').pop()}`;
    const result = await uploadImageToStorage(file, filename, 'marshall-assets');
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upload image' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'Image uploaded successfully. Add this URL to MARSHALL_FACE_REFERENCE_URL in .env.local',
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
