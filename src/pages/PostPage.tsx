import React from 'react';
import { useLocation, Link } from 'wouter';
import { PostItem } from '../types/content';
import postsData from '../content/posts.json';
import { PostContent } from '../components/post/PostContent';
import { PostShare } from '../components/post/PostShare';
import { PostNavigation } from '../components/post/PostNavigation';
import { RelatedPosts } from '../components/post/RelatedPosts';
import { NotFoundPage } from './NotFoundPage';

interface PostPageProps {
  onPostLoaded?: (post: PostItem | null) => void;
}

export const PostPage: React.FC<PostPageProps> = ({ onPostLoaded }) => {
  const [location] = useLocation();
  const cleanPath = location.split('?')[0].replace(/\/$/, '');
  const match = cleanPath.match(/^\/posts\/(.+)$/);
  const rawSlug = match ? decodeURIComponent(match[1]) : '';
  const posts = postsData as PostItem[];

  const postIndex = posts.findIndex((p) => p.slug === rawSlug);
  const post = postIndex !== -1 ? posts[postIndex] : null;

  React.useEffect(() => {
    if (onPostLoaded) {
      onPostLoaded(post);
    }
  }, [post, onPostLoaded]);

  if (!post) {
    return <NotFoundPage />;
  }

  const prevPost = postIndex < posts.length - 1 ? posts[postIndex + 1] : null;
  const nextPost = postIndex > 0 ? posts[postIndex - 1] : null;

  return (
    <div className="post-page max-w-4xl mx-auto py-2">
      {/* Post Header */}
      <header className="mb-8">
        {/* Post Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-heading tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {/* Post Subtitle / Description */}
        {post.description && (
          <p className="text-base text-text-muted/90 font-normal leading-relaxed mb-6 italic">
            {post.description}
          </p>
        )}

        {/* Post Metadata Bar */}
        <div className="post-meta flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-text-muted pt-2 pb-4 border-b border-main-border">
          {/* Author */}
          <div className="flex items-center gap-2">
            <i className="fa-regular fa-user text-xs" />
            <span className="font-semibold text-text">{post.author.name}</span>
          </div>

          {/* Publish Date */}
          <div className="flex items-center gap-1.5" title={`Published at ${post.date}`}>
            <i className="fa-regular fa-calendar text-xs" />
            <span>Posted <time>{post.date.split(' ')[0]}</time></span>
          </div>

          {/* Reading time */}
          <div className="flex items-center gap-1.5">
            <i className="fa-regular fa-clock text-xs" />
            <span>{post.readingTime.minutes} min read</span>
            <span className="text-text-muted/40">({post.readingTime.words} words)</span>
          </div>

          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="flex items-center gap-1.5">
              <i className="fa-regular fa-folder-open text-xs" />
              <div className="flex items-center gap-1">
                {post.categories.map((cat, idx) => (
                  <React.Fragment key={cat}>
                    {idx > 0 && <span className="text-text-muted/40 font-normal">/</span>}
                    <Link
                      href={`/categories/${cat.toLowerCase()}/`}
                      className="hover:text-link transition-colors font-medium"
                    >
                      {cat}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Feature Cover Image if specified */}
      {post.image?.path && (
        <div className="post-cover-image mb-8 rounded-2xl overflow-hidden shadow-lg border border-main-border">
          <img
            src={post.image.path}
            alt={post.image.alt || post.title}
            className="w-full h-auto max-h-[480px] object-cover"
          />
        </div>
      )}

      {/* Post Article Content */}
      <PostContent html={post.html} hasMermaid={post.mermaid} />

      {/* Post Tags */}
      {post.tags.length > 0 && (
        <div className="post-tags mt-10 pt-4 flex items-center gap-2 flex-wrap">
          <i className="fa-solid fa-tags text-xs text-text-muted" />
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${tag}/`}
              className="inline-block px-3 py-1 rounded-full text-xs bg-sidebar-bg border border-tag-border text-text-muted hover:bg-tag-hover hover:text-text transition-all"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Post Share & License */}
      <PostShare post={post} />

      {/* Previous / Next Post Navigation */}
      <PostNavigation prevPost={prevPost} nextPost={nextPost} />

      {/* Related Posts */}
      <RelatedPosts currentPost={post} />
    </div>
  );
};
