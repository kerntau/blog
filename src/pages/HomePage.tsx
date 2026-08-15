import React, { useState } from 'react';
import { Link } from 'wouter';
import { PostItem } from '../types/content';
import postsData from '../content/posts.json';

const POSTS_PER_PAGE = 5;

export const HomePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const posts = postsData as PostItem[];

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  return (
    <div className="home-page max-w-4xl mx-auto py-4">
      {/* Post List */}
      <div id="post-list" className="space-y-6">
        {currentPosts.map((post) => {
          const hasImage = Boolean(post.image?.path);

          return (
            <article
              key={post.slug}
              className="card-wrapper group block rounded-2xl border border-main-border bg-card-bg hover:border-text-muted/30 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className={`flex flex-col ${hasImage ? 'md:flex-row' : ''}`}>
                {/* Post Preview Image if available */}
                {hasImage && (
                  <Link
                    href={post.url}
                    className="preview-img md:w-2/5 shrink-0 overflow-hidden bg-sidebar-bg relative block aspect-video md:aspect-auto"
                  >
                    <img
                      src={post.image!.path}
                      alt={post.image!.alt || post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                )}

                {/* Card Body */}
                <div className="card-body p-6 md:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title */}
                    <h2 className="card-title text-xl md:text-2xl font-bold text-heading group-hover:text-link transition-colors leading-snug mb-3">
                      <Link href={post.url}>
                        {post.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="card-text text-sm text-text-muted line-clamp-2 md:line-clamp-3 leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Post Meta */}
                  <div className="post-meta text-xs text-text-muted flex items-center justify-between pt-3 border-t border-main-border/40">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Date */}
                      <span className="flex items-center gap-1.5" title={post.date}>
                        <i className="fa-regular fa-calendar" />
                        <time>{post.date.split(' ')[0]}</time>
                      </span>

                      {/* Categories */}
                      {post.categories.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <i className="fa-regular fa-folder-open" />
                          <Link
                            href={`/categories/${post.categories[0].toLowerCase()}/`}
                            className="hover:text-link transition-colors"
                          >
                            {post.categories[0]}
                          </Link>
                        </span>
                      )}
                    </div>

                    {/* Pin Badge */}
                    {post.pin && (
                      <div className="flex items-center gap-1 text-amber-500 font-medium text-xs">
                        <i className="fa-solid fa-thumbtack rotate-45" />
                        <span>Pinned</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination mt-12 flex items-center justify-center gap-2">
          {/* Previous Page */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-main-border bg-button-bg text-text-muted hover:text-text hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Previous Page"
          >
            <i className="fa-solid fa-angle-left mr-1" /> Prev
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                currentPage === page
                  ? 'bg-sidebar-hover text-sidebar-active border border-main-border shadow-sm'
                  : 'text-text-muted hover:text-text hover:bg-sidebar-hover'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Next Page */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-main-border bg-button-bg text-text-muted hover:text-text hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Next Page"
          >
            Next <i className="fa-solid fa-angle-right ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};
