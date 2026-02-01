/**
 * Upload image to Supabase Storage
 * 
 * Quick utility to upload Marshall's face reference image
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload image file to Supabase Storage
 */
export async function uploadImageToStorage(
  file: File | Buffer,
  filename: string,
  bucket: string = 'marshall-assets'
): Promise<UploadResult> {
  try {
    const supabase = createAdminSupabase();
    
    // Convert File to ArrayBuffer if needed
    let fileData: ArrayBuffer;
    if (file instanceof File) {
      fileData = await file.arrayBuffer();
    } else {
      fileData = file;
    }
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, fileData, {
        contentType: 'image/png',
        upsert: true, // Overwrite if exists
      });
    
    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return {
        success: false,
        error: error.message,
      };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);
    
    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Create storage bucket if it doesn't exist
 */
export async function ensureBucketExists(bucket: string = 'marshall-assets'): Promise<boolean> {
  try {
    const supabase = createAdminSupabase();
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      // Create bucket (requires service role key)
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true, // Make bucket public so images are accessible
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }
      
      console.log(`✅ Created bucket: ${bucket}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
}
