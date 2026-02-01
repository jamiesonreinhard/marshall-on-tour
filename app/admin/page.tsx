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

  const { count: calendarEntries } = await supabase
    .from("content_calendar")
    .select("*", { count: "exact", head: true });

  const { count: upcomingEntries } = await supabase
    .from("content_calendar")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_date", new Date().toISOString().split('T')[0])
    .in("status", ["planned", "approved"]);

  const { count: tournaments } = await supabase
    .from("atp_calendar")
    .select("*", { count: "exact", head: true });

  const adminPages = [
    {
      href: "/admin/posts",
      title: "Posts",
      icon: "📝",
      description: "Manage blog posts, drafts, and published content",
      stats: `${publishedPosts || 0} published, ${draftPosts || 0} drafts`,
      color: "blue",
    },
    {
      href: "/admin/calendar",
      title: "Content Calendar",
      icon: "📅",
      description: "Plan and schedule blog posts and social content",
      stats: `${upcomingEntries || 0} upcoming entries`,
      color: "green",
    },
    {
      href: "/admin/marshall-state",
      title: "Marshall's State",
      icon: "👤",
      description: "Manage Marshall's current gear, location, and preferences",
      stats: "Gear, location, interests",
      color: "pink",
    },
    {
      href: "/admin/board",
      title: "Project Board",
      icon: "📋",
      description: "Track progress on tasks and weekly goals",
      stats: "Kanban-style task management",
      color: "purple",
    },
    {
      href: "/admin/infrastructure",
      title: "Infrastructure",
      icon: "⚙️",
      description: "Database schema, APIs, integrations, and system overview",
      stats: "Complete system documentation",
      color: "gray",
    },
    {
      href: "/admin/how-it-works",
      title: "How It Works",
      icon: "❓",
      description: "High-level and technical explanation of how Marshall generates content",
      stats: "System architecture & flow",
      color: "indigo",
    },
    {
      href: "/admin/costs",
      title: "API Costs",
      icon: "💰",
      description: "Track API spending and stay under budget",
      stats: "Weekly cost tracking",
      color: "yellow",
    },
  ];

  const quickActions = [
    {
      href: "/api/posts/generate",
      title: "Generate Post",
      icon: "✨",
      description: "Auto-generate a blog post",
      external: false,
    },
    {
      href: "/admin/calendar",
      title: "Add Calendar Entry",
      icon: "➕",
      description: "Plan new content",
      external: false,
    },
    {
      href: "/api/calendar/sync-atp",
      title: "Sync ATP Calendar",
      icon: "🔄",
      description: "Update tournament schedule",
      external: false,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-lg text-gray-600">Manage Marshall's content and track progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Total Posts
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalPosts || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Published
          </div>
          <div className="text-2xl font-bold text-green-600">
            {publishedPosts || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Drafts
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {draftPosts || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Calendar Entries
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {calendarEntries || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Upcoming
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {upcomingEntries || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            Tournaments
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {tournaments || 0}
          </div>
        </div>
      </div>

      {/* Admin Pages Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Pages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{page.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{page.description}</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
              </div>
              <div className="text-xs text-gray-500 font-medium">{page.stats}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{action.icon}</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
