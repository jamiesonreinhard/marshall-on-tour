"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/posts";

export default function BlogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const category = searchParams.get("category") as "Gear" | "Travel" | "Analysis" | "Lifestyle" | null;
  const categories = ["Gear", "Travel", "Analysis", "Lifestyle"] as const;

  // Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const url = category ? `/api/posts?category=${category}` : '/api/posts';
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setPosts(data.posts || []);
        } else {
          console.error("Error fetching posts:", data.error);
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [category]);

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posts;
    }
    
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        post.category.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const handleCategoryClick = (cat: string | null) => {
    if (cat) {
      router.push(`/blog?category=${cat}`);
    } else {
      router.push("/blog");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
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
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">Blog</h1>
          <p className="text-lg text-zinc-600">
            Insights, gear reviews, travel guides, and match analysis from the tour
          </p>
        </div>
      </header>

      {/* Search Bar and Category Filters - Combined Sticky */}
      <div className="border-b border-zinc-200 bg-white sticky top-16 z-40">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
          {/* Search Bar */}
          <div className="py-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts by title, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 rounded-full border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !category
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              All Posts
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <main className="max-w-[1600px] mx-auto px-6 sm:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">Loading posts...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            {searchQuery && (
              <div className="mb-6">
                <p className="text-sm text-zinc-600">
                  Found {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} matching "{searchQuery}"
                </p>
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
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
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-zinc-900">
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
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-lg">
              {searchQuery
                ? `No posts found matching "${searchQuery}"`
                : category
                ? `No ${category} posts yet. Check back soon!`
                : "No posts yet. Check back soon!"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm text-zinc-900 hover:text-zinc-600 underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
