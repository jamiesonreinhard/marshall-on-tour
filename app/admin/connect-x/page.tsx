import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect X | Admin - Marshall',
  description: 'Connect Marshall’s X account via OAuth 2.0 for posting.',
};

export default function ConnectXPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com';
  const callbackUrl = `${baseUrl.replace(/\/$/, '')}/api/auth/x/callback`;
  const connectUrl = '/api/auth/x/connect';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect X (Twitter)</h1>
      <p className="text-gray-600 mb-6">
        Use OAuth 2.0 to authorize posting from Marshall’s X account. This is the method recommended in the{' '}
        <a
          href="https://docs.x.com/x-api/posts/create-post"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          X API Create Post docs
        </a>
        .
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-2">Steps</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
          <li>Ensure <code className="bg-gray-100 px-1 rounded">X_OAUTH2_CLIENT_ID</code> and <code className="bg-gray-100 px-1 rounded">X_OAUTH2_CLIENT_SECRET</code> are in <code className="bg-gray-100 px-1 rounded">.env.local</code>.</li>
          <li>In the X Developer Portal, set your app to <strong>Read and Write</strong> and add this callback URL: <code className="bg-gray-100 px-1 rounded text-sm break-all">{callbackUrl}</code></li>
          <li>Click the button below. You’ll be sent to X to authorize the app.</li>
          <li>After authorizing, you’ll see an access token. Add it to <code className="bg-gray-100 px-1 rounded">.env.local</code> as <code className="bg-gray-100 px-1 rounded">X_OAUTH2_USER_ACCESS_TOKEN</code>.</li>
          <li>Restart the dev server. New posts will be posted to X using OAuth 2.0.</li>
        </ol>

        <a
          href={connectUrl}
          className="inline-flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Connect X account
        </a>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Already using OAuth 1.0a (Access Token + Secret from Keys and tokens)? That still works; we prefer OAuth 2.0 user token if <code className="bg-gray-100 px-1 rounded">X_OAUTH2_USER_ACCESS_TOKEN</code> is set.
      </p>

      <p className="mt-4">
        <Link href="/admin" className="text-blue-600 hover:underline">← Back to Admin</Link>
      </p>
    </div>
  );
}
