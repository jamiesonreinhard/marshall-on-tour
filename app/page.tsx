import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

// Enable ISR - revalidate every hour
export const revalidate = 3600;

export default async function Home() {
  // Fetch latest 3 posts from Supabase
  const latestPosts = await getAllPosts(3);
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Homepage: Fetched posts:', latestPosts.length);
    if (latestPosts.length > 0) {
      console.log('Sample post:', {
        slug: latestPosts[0].slug,
        title: latestPosts[0].title,
        published: true,
      });
    }
  }
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
              <Link href="/" className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Blog
              </Link>
              <Link href="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                About
              </Link>
            </div>
            <div className="md:hidden">
              <button className="text-zinc-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl font-bold text-zinc-900 tracking-tight leading-tight">
                  The Tour, from the Inside
                </h1>
                <p className="text-xl text-zinc-600 leading-relaxed max-w-2xl">
                  I'm Marshall. For the past decade, I've lived out of a suitcase following the ATP Tour. 
                  This is where I share what I've learned about tennis, travel, and the gear that actually matters.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
                >
                  Read the Blog
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-6 py-3 border border-zinc-300 text-zinc-900 rounded-full font-medium hover:bg-zinc-50 transition-colors"
                >
                  About Marshall
                </Link>
              </div>

              {/* Tagline */}
              <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">
                Serve First. Travel Always.
              </p>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-[4/5] relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/base_identity.png"
                  alt="Marshall on tour"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-100 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 mb-2">Latest from the Tour</h2>
              <p className="text-zinc-600">Insights, gear reviews, and travel guides from the road</p>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              View All Posts
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {latestPosts.length > 0 ? (
              latestPosts.map((post) => (
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
                      <p className="text-sm text-zinc-500">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      <h3 className="text-xl font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-zinc-600 leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </article>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-zinc-500">No posts yet. Check back soon!</p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center sm:hidden">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              View All Posts
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-zinc-900">
            Follow the Journey
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Get the latest from the tour. Gear reviews, travel guides, and match analysis delivered straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
            <button className="px-6 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Marshall</h3>
              <p className="text-sm text-zinc-600">
                The ultimate tour insider's guide to tennis, travel, and quiet luxury.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 mb-4">Connect</h4>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-900 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-900 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-900 transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-200">
            <p className="text-xs text-zinc-500 text-center">
              © 2026 Marshall. All rights reserved.{" "}
              <Link href="/about" className="hover:text-zinc-700 underline">
                AI Disclosure
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
