import React from 'react';
import { Link } from 'wouter';
import { PostItem } from '../../types/content';

interface PostNavigationProps {
  prevPost?: PostItem | null;
  nextPost?: PostItem | null;
}

export const PostNavigation: React.FC<PostNavigationProps> = ({ prevPost, nextPost }) => {
  if (!prevPost && !nextPost) return null;

  return (
    <div className="post-navigation mt-10 pt-6 border-t border-main-border flex flex-col sm:flex-row gap-4 justify-between items-stretch">
      {/* Previous Post */}
      {prevPost ? (
        <Link
          href={prevPost.url}
          className="flex-1 group flex flex-col p-4 rounded-xl border border-main-border bg-card-bg hover:border-text-muted/30 hover:shadow-md transition-all text-left"
        >
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5 group-hover:text-link transition-colors">
            <i className="fa-solid fa-arrow-left text-[10px]" /> Previous Post
          </span>
          <span className="text-sm font-bold text-heading group-hover:text-link line-clamp-2 transition-colors">
            {prevPost.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1 hidden sm:block" />
      )}

      {/* Next Post */}
      {nextPost ? (
        <Link
          href={nextPost.url}
          className="flex-1 group flex flex-col p-4 rounded-xl border border-main-border bg-card-bg hover:border-text-muted/30 hover:shadow-md transition-all text-right items-end"
        >
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5 group-hover:text-link transition-colors">
            Next Post <i className="fa-solid fa-arrow-right text-[10px]" />
          </span>
          <span className="text-sm font-bold text-heading group-hover:text-link line-clamp-2 transition-colors">
            {nextPost.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1 hidden sm:block" />
      )}
    </div>
  );
};
