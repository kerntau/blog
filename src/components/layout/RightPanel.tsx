import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { TocItem, PostItem } from '../../types/content';
import postsData from '../../content/posts.json';
import tagsData from '../../content/tags.json';

interface RightPanelProps {
  toc?: TocItem[];
  isPostPage?: boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({ toc, isPostPage }) => {
  const [activeId, setActiveId] = useState<string>('');

  // Scrollspy logic for Table of Contents
  useEffect(() => {
    if (!isPostPage || !toc || toc.length === 0) return;

    const headingElements = toc
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headingElements.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      let currentActiveId = '';

      for (let i = 0; i < headingElements.length; i++) {
        const heading = headingElements[i];
        if (heading.offsetTop <= scrollPosition) {
          currentActiveId = heading.id;
        } else {
          break;
        }
      }

      if (currentActiveId) {
        setActiveId(currentActiveId);
      } else if (headingElements.length > 0) {
        setActiveId(headingElements[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc, isPostPage]);

  // Handle smooth scroll to heading
  const scrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const topOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveId(id);
      history.pushState(null, '', `#${id}`);
    }
  };

  // Top trending tags sorted by count
  const trendingTags = Object.values(tagsData as Record<string, { name: string; count: number }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recently updated posts
  const recentPosts = (postsData as PostItem[]).slice(0, 5);

  return (
    <aside
      id="panel-wrapper"
      className="hidden xl:block w-[240px] xxl:w-[280px] pl-6 pr-2 py-6 text-sm text-text-muted select-none"
    >
      <div className="sticky top-[4.5rem] space-y-8">
        {isPostPage && toc && toc.length > 0 ? (
          /* Table of Contents */
          <div className="toc-wrapper">
            <h3 className="text-xs font-bold uppercase tracking-widest text-heading mb-4 pl-3 border-l-2 border-transparent">
              Contents
            </h3>
            <nav className="toc-nav relative max-h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar">
              <ul className="space-y-1 text-xs border-l border-main-border">
                {toc.map((item) => {
                  const isActive = activeId === item.id;
                  const indentClass =
                    item.level === 2 ? 'pl-3 font-medium' : item.level === 3 ? 'pl-6' : 'pl-9 text-[11px]';
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => scrollToHeading(e, item.id)}
                        className={`block py-1 transition-all duration-150 border-l-2 -ml-[1px] ${indentClass} ${
                          isActive
                            ? 'border-toc-highlight text-toc-highlight font-semibold'
                            : 'border-transparent text-text-muted hover:text-text hover:border-text-muted/40'
                        }`}
                      >
                        {item.text}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        ) : (
          /* Trending Tags & Recently Updated for non-post pages */
          <div className="space-y-8">
            {/* Recently Updated */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-heading mb-3 flex items-center gap-2">
                <i className="fa-regular fa-clock text-xs text-text-muted" /> Recently Updated
              </h3>
              <ul className="space-y-2 text-xs">
                {recentPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={post.url}
                      className="block truncate hover:text-link transition-colors py-0.5"
                      title={post.title}
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trending Tags */}
            {trendingTags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-heading mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-fire text-xs text-amber-500" /> Trending Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {trendingTags.map((tag) => (
                    <Link
                      key={tag.name}
                      href={`/tags/${tag.name}/`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-sidebar-bg border border-tag-border text-text-muted hover:bg-tag-hover hover:text-text transition-all"
                    >
                      <span>#{tag.name}</span>
                      <span className="text-[10px] text-text-muted/70">({tag.count})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
