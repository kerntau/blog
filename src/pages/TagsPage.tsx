import React from 'react';
import { useLocation, Link } from 'wouter';
import tagsData from '../content/tags.json';
import postsData from '../content/posts.json';
import { TagItem, PostItem } from '../types/content';

export const TagsPage: React.FC = () => {
  const [location] = useLocation();
  const cleanPath = location.split('?')[0].replace(/\/$/, '');
  const match = cleanPath.match(/^\/tags\/(.+)$/);
  const targetTag = match ? decodeURIComponent(match[1]).toLowerCase() : '';

  const tags = tagsData as Record<string, TagItem>;
  const allPosts = postsData as PostItem[];

  // If viewing a single tag
  if (targetTag) {
    const filteredPosts = allPosts.filter((p) =>
      p.tags.some(
        (t) =>
          t.toLowerCase() === targetTag ||
          t.toLowerCase().replace(/\s+/g, '-') === targetTag ||
          t.toLowerCase() === targetTag.replace(/-/g, ' ')
      )
    );

    return (
      <div className="tags-page max-w-4xl mx-auto py-4">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-main-border">
          <i className="fa-solid fa-tag text-2xl text-text-muted" />
          <h1 className="text-2xl font-bold text-heading">
            #{targetTag}
            <span className="ml-3 text-sm font-normal text-text-muted">
              ({filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'})
            </span>
          </h1>
        </div>

        <ul className="space-y-4">
          {filteredPosts.map((post) => (
            <li
              key={post.slug}
              className="flex items-center justify-between p-4 rounded-xl border border-main-border bg-card-bg hover:border-text-muted/30 transition-all group"
            >
              <Link
                href={post.url}
                className="text-base font-semibold text-heading group-hover:text-link transition-colors truncate flex-1"
              >
                {post.title}
              </Link>
              <span className="text-xs text-text-muted font-mono shrink-0 ml-4">
                {post.date.split(' ')[0]}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link
            href="/tags/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-link transition-colors"
          >
            <i className="fa-solid fa-arrow-left" /> Back to all tags
          </Link>
        </div>
      </div>
    );
  }

  // All tags cloud
  const sortedTags = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="tags-page max-w-4xl mx-auto py-4">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-main-border">
        <i className="fa-solid fa-tags text-2xl text-text-muted" />
        <h1 className="text-2xl font-bold text-heading">
          Tags
          <span className="ml-3 text-sm font-normal text-text-muted">
            ({sortedTags.length})
          </span>
        </h1>
      </div>

      <div className="flex flex-wrap gap-3">
        {sortedTags.map(([tagName, tagData]) => (
          <Link
            key={tagName}
            href={`/tags/${tagName}/`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-card-bg border border-tag-border hover:border-text-muted/40 hover:shadow-sm text-text transition-all group"
          >
            <span className="group-hover:text-link transition-colors">#{tagName}</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs font-mono bg-sidebar-bg text-text-muted">
              {tagData.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
