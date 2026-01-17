import Image from "next/image";
import Link from "next/link";
import { getAllPosts, getPostsByCategory } from "@/lib/posts";
import { Metadata } from "next";

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "Blog | Marshall - The Tour, from the Inside",
  description: "Read Marshall's latest insights on tennis, travel, gear, and match analysis from the ATP Tour.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category as "Gear" | "Travel" | "Analysis" | "Lifestyle" | undefined;
  
  const posts = category
    ? await getPostsByCategory(category)
    : await getAllPosts();

  const categories = ["Gear", "Travel", "Analysis", "Lifestyle"] as const;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-semibold text-zinc-900 tracking-tight">
              Marshall
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-sm font-medium text-zinc-900 font-semibold">
                Blog
              </Link>
              <Link href="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">Blog</h1>
          <p className="text-lg text-zinc-600">
            Insights, gear reviews, travel guides, and match analysis from the tour
          </p>
        </div>
      </header>

      {/* Category Filters */}
      <div className="border-b border-zinc-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex gap-4 overflow-x-auto py-4">
            <Link
              href="/blog"
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !category
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              All Posts
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/blog?category=${cat}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="space-y-4">
                  <div className="aspect-[4/3] relative rounded-xl overflow-hidden bg-zinc-100">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-zinc-900">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-500">
                      {new Date(post.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-zinc-600 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <span>{post.readingTime} min read</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-lg">
              {category
                ? `No ${category} posts yet. Check back soon!`
                : "No posts yet. Check back soon!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
