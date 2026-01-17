import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();

  // Get stats
  const { count: totalPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  const { count: publishedPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("published", true);

  const { count: draftPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("published", false);

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <div className="text-sm font-medium text-zinc-500 mb-1">
            Total Posts
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {totalPosts || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <div className="text-sm font-medium text-zinc-500 mb-1">
            Published
          </div>
          <div className="text-3xl font-bold text-green-600">
            {publishedPosts || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-6">
          <div className="text-sm font-medium text-zinc-500 mb-1">Drafts</div>
          <div className="text-3xl font-bold text-yellow-600">
            {draftPosts || 0}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
          >
            Create New Post
          </Link>
          <Link
            href="/admin/posts"
            className="px-4 py-2 border border-zinc-300 text-zinc-900 rounded-lg font-medium hover:bg-zinc-50 transition-colors"
          >
            Manage Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
