import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { Metadata } from "next";
import { PostsList } from "./PostsList";

export const metadata: Metadata = {
  title: "Posts | Admin - Marshall",
};

export default async function AdminPostsPage() {
  const supabase = await createServerSupabase();

  // Fetch all posts (including drafts)
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, slug, category, published, published_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading posts: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Posts</h1>
          <p className="text-gray-600">
            Full list of all blog posts. For review and publish workflow, use{" "}
            <Link href="/admin/queue" className="text-blue-600 hover:underline">Post Queue</Link>.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/posts/generate"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Generate Post (AI)
          </Link>
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            New Post (Manual)
          </Link>
        </div>
      </div>

      <PostsList posts={posts || []} />
    </div>
  );
}
