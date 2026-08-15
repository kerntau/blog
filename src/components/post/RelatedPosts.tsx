import React from 'react';
import { Link } from 'wouter';
import { PostItem } from '../../types/content';
import postsData from '../../content/posts.json';

interface RelatedPostsProps {
  currentPost: PostItem;
}

export const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentPost }) => {
  const allPosts = postsData as PostItem[];

  // Find related posts by shared categories or tags
  const related = allPosts
    .filter((p) => p.slug !== currentPost.slug)
    .map((p) => {
      let score = 0;
      for (const c of p.categories) {
        if (currentPost.categories.includes(c)) score += 2;
      }
      for (const t of p.tags) {
        if (currentPost.tags.includes(t)) score += 1;
      }
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.post);

  if (related.length === 0) return null;

  return (
    <div className="related-posts mt-12 pt-8 border-t border-main-border">
      <h3 className="text-sm font-bold uppercase tracking-wider text-heading mb-6 flex items-center gap-2">
        <i className="fa-solid fa-book-open text-xs text-text-muted" /> Further Reading
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={post.url}
            className="group flex flex-col p-4 rounded-xl border border-main-border bg-card-bg hover:border-text-muted/30 hover:shadow-md transition-all"
          >
            <h4 className="text-sm font-bold text-heading group-hover:text-link transition-colors line-clamp-2 mb-2">
              {post.title}
            </h4>
            <p className="text-xs text-text-muted line-clamp-3 leading-relaxed flex-1">
              {post.excerpt}
            </p>
            <div className="mt-4 pt-2 border-t border-main-border/50 text-[11px] text-text-muted/80 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar" />
              <span>{post.date.split(' ')[0]}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
