'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  published_at: string | null;
}

interface PostsListProps {
  posts: Post[];
}

export function PostsList({ posts: initialPosts }: PostsListProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setDeletingId(postToDelete.id);
    
    try {
      const response = await fetch(`/api/posts/${postToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      // Remove the post from the list
      setPosts(posts.filter(p => p.id !== postToDelete.id));
      setPostToDelete(null);
      
      // Refresh the page to ensure consistency
      router.refresh();
    } catch (error: any) {
      alert(`Failed to delete post: ${error.message}`);
      setPostToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setPostToDelete(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Published
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {post.title}
                    </div>
                    <div className="text-sm text-gray-500">{post.slug}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {post.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      post.published
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {post.published && (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        View
                      </Link>
                    )}
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(post)}
                      disabled={deletingId === post.id}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                No posts yet.{" "}
                <Link
                  href="/admin/posts/new"
                  className="text-gray-900 font-medium hover:underline"
                >
                  Create your first post
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={postToDelete !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message={
          postToDelete
            ? `Are you sure you want to delete "${postToDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={deletingId !== null}
      />
    </div>
  );
}