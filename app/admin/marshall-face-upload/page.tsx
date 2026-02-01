'use client';

import { useState } from 'react';
import { AdminHeader } from '@/app/admin/components/AdminHeader';

export default function MarshallFaceUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/marshall-face', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          url: data.url,
        });
      } else {
        setResult({
          success: false,
          error: data.error || 'Upload failed',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Upload Marshall Face Reference</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image File
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                Max file size: 5MB. Recommended: Square image (1:1 aspect ratio), high quality.
              </p>
            </div>

            {file && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                </p>
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="max-w-xs rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload to Supabase Storage'}
            </button>

            {result && (
              <div className={`mt-4 p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {result.success ? (
                  <div>
                    <p className="text-green-800 font-medium mb-2">✅ Upload Successful!</p>
                    <p className="text-sm text-green-700 mb-2">
                      Image URL: <code className="bg-green-100 px-2 py-1 rounded">{result.url}</code>
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">Next Steps:</p>
                      <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                        <li>Copy the URL above</li>
                        <li>Add to <code className="bg-blue-100 px-1 rounded">.env.local</code>:</li>
                        <li className="ml-4">
                          <code className="bg-blue-100 px-2 py-1 rounded block mt-1">
                            MARSHALL_FACE_REFERENCE_URL={result.url}
                          </code>
                        </li>
                        <li>Restart your dev server</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-red-800 font-medium mb-2">❌ Upload Failed</p>
                    <p className="text-sm text-red-700">{result.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h2 className="font-medium text-gray-900 mb-2">Quick Option (No Upload Needed)</h2>
          <p className="text-sm text-gray-600 mb-2">
            If you already have an image in <code className="bg-gray-200 px-1 rounded">public/assets/</code>, you can use it directly:
          </p>
          <code className="block bg-gray-200 px-3 py-2 rounded text-sm">
            MARSHALL_FACE_REFERENCE_URL=/assets/base_identity.png
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Note: This only works for local development. For production, use Supabase Storage.
          </p>
        </div>
      </div>
    </div>
  );
}
