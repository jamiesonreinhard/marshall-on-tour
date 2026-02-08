'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  featured_image: string | null;
  reading_time: number;
  author_name: string;
}

interface SocialPost {
  id: string;
  post_id: string | null;
  platform: 'instagram' | 'x' | 'threads';
  content: string;
  scheduled_at: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function PostQueuePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPostsCount, setAllPostsCount] = useState(0); // total from API (before filter)
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'drafts' | 'published'>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullPostContent, setFullPostContent] = useState<string | null>(null);
  const [renderedContent, setRenderedContent] = useState<string | null>(null);
  const [loadingFullContent, setLoadingFullContent] = useState(false);

  useEffect(() => {
    loadQueue();
  }, [filter]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      
      // Load posts
      const postsResponse = await fetch('/api/posts/queue');
      const postsData = await postsResponse.json();
      
      const allPosts = postsData.posts || [];
      setAllPostsCount(allPosts.length);

      let filteredPosts = allPosts;
      if (filter === 'drafts') {
        filteredPosts = filteredPosts.filter((p: Post) => !p.published);
      } else if (filter === 'published') {
        filteredPosts = filteredPosts.filter((p: Post) => p.published);
      }

      setPosts(filteredPosts);
      
      // Load social posts
      const socialResponse = await fetch('/api/social-posts/queue');
      const socialData = await socialResponse.json();
      setSocialPosts(socialData.socialPosts || []);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/publish`, {
        method: 'POST',
      });
      
      if (response.ok) {
        loadQueue();
      } else {
        const error = await response.json();
        alert(`Failed to publish: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish post');
    }
  };

  const handleUnpublish = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/unpublish`, {
        method: 'POST',
      });
      
      if (response.ok) {
        loadQueue();
      } else {
        const error = await response.json();
        alert(`Failed to unpublish: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to unpublish:', error);
      alert('Failed to unpublish post');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadQueue();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete post');
    }
  };

  const handleGeneratePost = async () => {
    if (!confirm('Generate a new post from the best available opportunity?')) return;
    
    try {
      const response = await fetch('/api/jobs/content-intelligence', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success && result.action === 'generated') {
        alert('Post generated successfully! Check the queue.');
        loadQueue();
      } else {
        alert(`No post generated: ${result.reason || 'No suitable opportunity found'}`);
      }
    } catch (error) {
      console.error('Failed to generate post:', error);
      alert('Failed to generate post');
    }
  };

  // Simple markdown renderer for client-side fallback
  const renderMarkdownSimple = (markdown: string): string => {
    let html = markdown;
    
    // Headings (process in order from most specific to least)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>');
    
    // Affiliate links - show as placeholder in admin (yellow badge) but will be removed/hidden in published posts if no link exists
    html = html.replace(/\[AFF:([^\]]+)\]/g, '<span class="bg-yellow-100 px-2 py-1 rounded text-sm font-medium" title="Affiliate link placeholder - will be hidden if no link is configured">[AFF:$1]</span>');
    
    // Lists - handle bullet points
    const lines = html.split('\n');
    let inList = false;
    let listItems: string[] = [];
    const processedLines: string[] = [];
    
    for (const line of lines) {
      if (line.match(/^[\-\*] /)) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(line.replace(/^[\-\*] /, '').trim());
      } else {
        if (inList) {
          processedLines.push(`<ul class="list-disc ml-6 my-4 space-y-2">${listItems.map(item => `<li class="text-gray-700">${item}</li>`).join('')}</ul>`);
          inList = false;
          listItems = [];
        }
        processedLines.push(line);
      }
    }
    if (inList) {
      processedLines.push(`<ul class="list-disc ml-6 my-4 space-y-2">${listItems.map(item => `<li class="text-gray-700">${item}</li>`).join('')}</ul>`);
    }
    html = processedLines.join('\n');
    
    // Paragraphs (split by double newlines, but preserve lists and headings)
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      // Don't wrap if it's already a heading, list, or contains HTML
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<li') || p.includes('<')) {
        return p;
      }
      return `<p class="mb-4 leading-relaxed text-gray-700">${p}</p>`;
    }).join('\n');
    
    return html;
  };

  const handleViewPost = async (post: Post) => {
    setSelectedPost(post);
    setShowViewModal(true);
    
    let content = post.content;
    
    // If we don't have full content, fetch it
    if (!content) {
      setLoadingFullContent(true);
      try {
        const response = await fetch(`/api/posts/${post.id}`);
        const data = await response.json();
        if (data.post) {
          content = data.post.content;
        }
      } catch (error) {
        console.error('Failed to load full post content:', error);
      } finally {
        setLoadingFullContent(false);
      }
    }
    
    if (content) {
      setFullPostContent(content);
      // Convert markdown to HTML
      try {
        const response = await fetch('/api/markdown/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: content }),
        });
        const data = await response.json();
        if (data.html) {
          setRenderedContent(data.html);
        } else {
          // Fallback: simple markdown rendering
          setRenderedContent(renderMarkdownSimple(content));
        }
      } catch (error) {
        console.error('Failed to render markdown:', error);
        // Fallback: simple markdown rendering
        setRenderedContent(renderMarkdownSimple(content));
      }
    }
  };


  const handleEditPost = (post: Post) => {
    // Navigate to edit page (we'll create this)
    router.push(`/admin/posts/${post.id}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading post queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Post Queue</h1>
            <p className="text-lg text-gray-600">
              Review and approve posts generated by Marshall. Same posts as &quot;Posts&quot; — this view is filtered (drafts / published / all).
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGeneratePost}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              ✨ Generate Post
            </button>
            <Link
              href="/admin/posts"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View All Posts
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            {(['all', 'drafts', 'published'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <div className="ml-auto text-sm text-gray-600">
              {filter !== 'all' && allPostsCount > 0 ? (
                <>Showing {posts.length} of {allPostsCount} posts</>
              ) : (
                <>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</>
              )}
              {socialPosts.length > 0 && ` • ${socialPosts.length} social ${socialPosts.length === 1 ? 'post' : 'posts'}`}
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-lg text-gray-600 mb-2">No posts in queue</p>
              <p className="text-sm text-gray-500 mb-4">
                Click "Generate Post" to create a new post from available opportunities
              </p>
              <button
                onClick={handleGeneratePost}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate First Post
              </button>
            </div>
          ) : (
            posts.map(post => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Featured Image */}
                  {post.featured_image && (
                    <div className="flex-shrink-0">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          // Hide image if it fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        post.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {post.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>By {post.author_name}</span>
                      <span>•</span>
                      <span>{post.reading_time} min read</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.published_at && (
                        <>
                          <span>•</span>
                          <span>Published {new Date(post.published_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewPost(post)}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      View
                    </button>
                    {!post.published && (
                      <>
                        <button
                          onClick={() => handleEditPost(post)}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePublish(post.id)}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Publish
                        </button>
                      </>
                    )}
                    {post.published && (
                      <button
                        onClick={() => handleUnpublish(post.id)}
                        className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Social Posts Section */}
        {socialPosts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Social Posts</h2>
            <div className="space-y-3">
              {socialPosts.map(social => (
                <div
                  key={social.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          social.platform === 'x' ? 'bg-black text-white' :
                          social.platform === 'instagram' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {social.platform.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          social.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {social.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-gray-700">{social.content}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        Created {new Date(social.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Post Modal */}
        {showViewModal && selectedPost && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowViewModal(false);
              setSelectedPost(null);
              setFullPostContent(null);
            }}
          >
            <div
              className="bg-gray-900/60 backdrop-blur-sm fixed inset-0"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden z-50 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPost.title}</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPost(null);
                    setFullPostContent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {loadingFullContent ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading post content...</p>
                  </div>
                ) : (
                  <div className="max-w-none">
                    {/* Featured Image */}
                    {selectedPost.featured_image && (
                      <div className="mb-6">
                        <img
                          src={selectedPost.featured_image}
                          alt={selectedPost.title}
                          className="w-full h-auto rounded-lg border border-gray-200"
                          onError={(e) => {
                            // Hide image if it fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <p className="text-lg text-gray-600 italic">{selectedPost.excerpt}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span>Category: {selectedPost.category}</span>
                        <span>•</span>
                        <span>{selectedPost.reading_time} min read</span>
                        <span>•</span>
                        <span>By {selectedPost.author_name}</span>
                      </div>
                    </div>
                    {renderedContent ? (
                      <div
                        className="prose prose-lg max-w-none text-gray-900"
                        dangerouslySetInnerHTML={{ __html: renderedContent }}
                      />
                    ) : fullPostContent ? (
                      <div
                        className="prose prose-lg max-w-none text-gray-900"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownSimple(fullPostContent) }}
                      />
                    ) : (
                      <div className="text-gray-500">
                        <p>Content not available. This might be a draft post.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  {!selectedPost.published && (
                    <>
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleEditPost(selectedPost);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                      >
                        Edit Post
                      </button>
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handlePublish(selectedPost.id);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        Publish
                      </button>
                    </>
                  )}
                  {selectedPost.published && (
                    <Link
                      href={`/blog/${selectedPost.slug}`}
                      target="_blank"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      View on Site
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPost(null);
                    setFullPostContent(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
