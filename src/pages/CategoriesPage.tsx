import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import categoriesData from '../content/categories.json';
import postsData from '../content/posts.json';
import { CategoryItem, PostItem } from '../types/content';

export const CategoriesPage: React.FC = () => {
  const [location] = useLocation();
  const cleanPath = location.split('?')[0].replace(/\/$/, '');
  const match = cleanPath.match(/^\/categories\/(.+)$/);
  const targetCategory = match ? decodeURIComponent(match[1]).toLowerCase() : '';

  const categories = categoriesData as Record<string, CategoryItem>;
  const allPosts = postsData as PostItem[];

  // Track expanded parent categories
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    Object.keys(categories).forEach((cat) => {
      init[cat] = true; // default expanded
    });
    return init;
  });

  const toggleCategory = (catName: string) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  // If viewing a single category
  if (targetCategory) {
    const filteredPosts = allPosts.filter((p) =>
      p.categories.some((c) => c.toLowerCase() === targetCategory)
    );

    const displayName =
      Object.keys(categories).find((k) => k.toLowerCase() === targetCategory) ||
      targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1);

    return (
      <div className="categories-page max-w-4xl mx-auto py-4">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-main-border">
          <i className="fa-regular fa-folder-open text-2xl text-text-muted" />
          <h1 className="text-2xl font-bold text-heading">
            {displayName}
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
            href="/categories/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-link transition-colors"
          >
            <i className="fa-solid fa-arrow-left" /> Back to all categories
          </Link>
        </div>
      </div>
    );
  }

  // Listing all categories with tree/accordion
  return (
    <div className="categories-page max-w-4xl mx-auto py-4">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-main-border">
        <i className="fa-solid fa-stream text-2xl text-text-muted" />
        <h1 className="text-2xl font-bold text-heading">
          Categories
          <span className="ml-3 text-sm font-normal text-text-muted">
            ({Object.keys(categories).length})
          </span>
        </h1>
      </div>

      <div className="space-y-6">
        {Object.entries(categories).map(([catName, catData]) => {
          const isExpanded = expandedCats[catName] !== false;
          const subCats = Object.entries(catData.children || {});

          return (
            <div
              key={catName}
              className="card-category rounded-2xl border border-main-border bg-card-bg overflow-hidden shadow-sm"
            >
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(catName)}
                className="flex items-center justify-between px-6 py-4 bg-sidebar-bg/60 cursor-pointer hover:bg-sidebar-hover transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <i
                    className={`fa-solid fa-chevron-right text-xs text-text-muted transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                  <i className="fa-regular fa-folder text-base text-text-muted" />
                  <span className="text-base font-bold text-heading">{catName}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-main-bg border border-main-border text-text-muted">
                  {catData.count} {catData.count === 1 ? 'post' : 'posts'}
                </span>
              </div>

              {/* Subcategories & Posts Accordion Body */}
              {isExpanded && (
                <div className="p-4 sm:p-6 space-y-4 border-t border-main-border/50">
                  {/* Top category direct posts */}
                  <ul className="space-y-2.5">
                    {catData.posts.map((slug) => {
                      const post = allPosts.find((p) => p.slug === slug);
                      if (!post) return null;
                      return (
                        <li key={slug} className="flex items-center justify-between text-sm pl-4">
                          <Link
                            href={post.url}
                            className="font-medium text-text hover:text-link transition-colors truncate flex-1"
                          >
                            <i className="fa-regular fa-file-lines text-xs text-text-muted/60 mr-2" />
                            {post.title}
                          </Link>
                          <span className="text-xs text-text-muted font-mono shrink-0 ml-4">
                            {post.date.split(' ')[0]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Subcategories if any */}
                  {subCats.length > 0 && (
                    <div className="pt-4 border-t border-main-border/40 space-y-4 pl-4">
                      {subCats.map(([subName, subData]) => (
                        <div key={subName} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-heading">
                            <i className="fa-solid fa-arrow-turn-down-right text-xs text-text-muted/70" />
                            <i className="fa-regular fa-folder-open text-xs text-text-muted" />
                            <span>{subName}</span>
                            <span className="text-xs text-text-muted font-normal">({subData.count})</span>
                          </div>
                          <ul className="pl-6 space-y-2">
                            {subData.posts.map((slug) => {
                              const post = allPosts.find((p) => p.slug === slug);
                              if (!post) return null;
                              return (
                                <li key={slug} className="flex items-center justify-between text-xs">
                                  <Link
                                    href={post.url}
                                    className="text-text hover:text-link transition-colors truncate flex-1"
                                  >
                                    {post.title}
                                  </Link>
                                  <span className="text-[11px] text-text-muted font-mono shrink-0 ml-4">
                                    {post.date.split(' ')[0]}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
