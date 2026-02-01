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
          <p className="text-gray-600">Manage your blog posts</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          New Post
        </Link>
      </div>

      <PostsList posts={posts || []} />
    </div>
  );
}
