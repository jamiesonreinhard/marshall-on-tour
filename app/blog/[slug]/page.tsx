import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, getRelatedPosts, type BlogPost } from "@/lib/posts";
import { markdownToHtml, processAffiliateLinks } from "@/lib/markdown";

// Enable ISR (Incremental Static Regeneration)
// Revalidate every hour, or on-demand via API route
export const revalidate = 3600; // 1 hour

// Generate static params for ISR
export async function generateStaticParams() {
  // This will be called at build time to pre-render popular posts
  // For now, return empty array - posts will be generated on-demand
  // You can optimize by pre-rendering top posts
  return [];
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marshallontour.com";
  const imageUrl = `${siteUrl}${post.featuredImage}`;

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords: post.seo.keywords.join(", "),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      url: `${siteUrl}/blog/${post.slug}`,
      siteName: "Marshall",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "en_US",
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updatedDate || post.date,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [imageUrl],
      creator: "@MarshallOnTour",
    },
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// Structured Data (JSON-LD) for SEO
function BlogPostStructuredData({ post }: { post: BlogPost }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marshallontour.com";
  const imageUrl = `${siteUrl}${post.featuredImage}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: post.date,
    dateModified: post.updatedDate || post.date,
    author: {
      "@type": "Person",
      name: post.author.name,
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "Marshall",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/base_identity.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
    articleSection: post.category,
    keywords: post.tags.join(", "),
    wordCount: post.content.replace(/<[^>]*>/g, "").split(/\s+/).length,
    timeRequired: `PT${post.readingTime}M`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Breadcrumb Structured Data
function BreadcrumbStructuredData({ post }: { post: BlogPost }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marshallontour.com";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// Affiliate Link Component
function AffiliateLink({ text, url, brand }: { text: string; url: string; brand: string }) {
  return (
    <a
      href={url}
      rel="nofollow sponsored"
      className="text-zinc-900 font-medium underline hover:text-zinc-600 transition-colors"
      target="_blank"
    >
      {text}
    </a>
  );
}

// Reading Time Component
function ReadingTime({ minutes }: { minutes: number }) {
  return (
    <span className="text-sm text-zinc-500">
      {minutes} min read
    </span>
  );
}

// Share Buttons Component
function ShareButtons({ post }: { post: BlogPost }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marshallontour.com";
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const encodedTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(postUrl);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  return (
    <div className="flex items-center gap-4 pt-8 border-t border-zinc-200">
      <span className="text-sm font-medium text-zinc-900">Share:</span>
      <div className="flex gap-3">
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-900 transition-colors"
          aria-label="Share on Twitter"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-900 transition-colors"
          aria-label="Share on Facebook"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-600 hover:text-zinc-900 transition-colors"
          aria-label="Share on LinkedIn"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

// Related Posts Component
async function RelatedPosts({ currentSlug, category, tags }: { currentSlug: string; category: string; tags: string[] }) {
  const relatedPosts = await getRelatedPosts(currentSlug, category, tags, 2);

  return (
    <section className="mt-16 pt-16 border-t border-zinc-200">
      <h2 className="text-2xl font-bold text-zinc-900 mb-8">Related Posts</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {relatedPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <article className="space-y-4">
                  <div className="aspect-[16/9] relative rounded-xl overflow-hidden bg-zinc-100">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                    {post.title}
                  </h3>
                </article>
              </Link>
            ))}
          </div>
    </section>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // In Next.js 16, params is a Promise - must await it
  const { slug } = await params;
  
  // Log for debugging
  console.log('BlogPostPage: Looking for slug:', slug);
  
  const post = await getPost(slug);

  if (!post) {
    console.log('BlogPostPage: Post not found, calling notFound()');
    notFound();
  }
  
  console.log('BlogPostPage: Post found:', post.title);

  // Convert markdown to HTML
  const htmlContent = await markdownToHtml(post.content);
  const processedContent = processAffiliateLinks(htmlContent, post.affiliateLinks || []);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://marshallontour.com";

  return (
    <>
      <BlogPostStructuredData post={post} />
      <BreadcrumbStructuredData post={post} />

      <article className="min-h-screen bg-white">
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
                <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                  Blog
                </Link>
                <Link href="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                  About
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Breadcrumbs */}
        <nav className="bg-zinc-50 border-b border-zinc-200" aria-label="Breadcrumb">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 py-4">
            <ol className="flex items-center space-x-2 text-sm text-zinc-600">
              <li>
                <Link href="/" className="hover:text-zinc-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href="/blog" className="hover:text-zinc-900 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-zinc-900 font-medium" aria-current="page">
                {post.title}
              </li>
            </ol>
          </div>
        </nav>

        {/* Article Header */}
        <header className="max-w-4xl mx-auto px-6 sm:px-8 pt-12 pb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-900 rounded-full text-xs font-medium">
                {post.category}
              </span>
              <ReadingTime minutes={post.readingTime} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-zinc-600 leading-relaxed">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-zinc-900">M</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{post.author.name}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(post.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="max-w-4xl mx-auto px-6 sm:px-8 mb-12">
          <div className="aspect-[16/9] relative rounded-2xl overflow-hidden bg-zinc-100">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-6 sm:px-8 pb-16">
          {/* Affiliate Disclosure */}
          {post.affiliateLinks && post.affiliateLinks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-amber-900">
                <strong>Disclosure:</strong> This post contains affiliate links. If you make a purchase through these links, I may earn a commission at no extra cost to you. I only recommend products I've personally tested and trust.
              </p>
            </div>
          )}

          {/* Article Body */}
          <article
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-zinc-200">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <ShareButtons post={post} />

          {/* Related Posts */}
          <RelatedPosts currentSlug={post.slug} category={post.category} tags={post.tags} />
        </div>
      </article>
    </>
  );
}
