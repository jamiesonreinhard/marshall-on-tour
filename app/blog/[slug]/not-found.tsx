import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold text-zinc-900">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-700">Post Not Found</h2>
        <p className="text-zinc-600">
          The blog post you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/blog"
            className="px-6 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
          >
            View All Posts
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-zinc-300 text-zinc-900 rounded-full font-medium hover:bg-zinc-50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
