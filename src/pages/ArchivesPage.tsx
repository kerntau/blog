import React from 'react';
import { Link } from 'wouter';
import archivesData from '../content/archives.json';
import postsData from '../content/posts.json';
import { ArchiveYear, PostItem } from '../types/content';

export const ArchivesPage: React.FC = () => {
  const archives = archivesData as ArchiveYear[];
  const totalPosts = (postsData as PostItem[]).length;

  return (
    <div className="archives-page max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-main-border">
        <i className="fa-solid fa-box-archive text-2xl text-text-muted" />
        <h1 className="text-2xl font-bold text-heading">
          Archives
          <span className="ml-3 text-sm font-normal text-text-muted">
            ({totalPosts} {totalPosts === 1 ? 'post' : 'posts'})
          </span>
        </h1>
      </div>

      {/* Timeline */}
      <div className="timeline relative pl-6 border-l-2 border-timeline-color space-y-12">
        {archives.map((yearGroup) => (
          <div key={yearGroup.year} className="relative">
            {/* Year Badge Node */}
            <div className="flex items-center gap-3 mb-6 -ml-[31px]">
              <div className="w-4 h-4 rounded-full bg-timeline-node-bg ring-4 ring-main-bg" />
              <h2 className="text-xl font-bold text-heading tracking-tight font-mono">
                {yearGroup.year}
                <span className="ml-2 text-xs font-normal text-text-muted">
                  ({yearGroup.posts.length})
                </span>
              </h2>
            </div>

            {/* Posts in this year */}
            <ul className="space-y-4 pl-2">
              {yearGroup.posts.map((post) => {
                const dateObj = new Date(post.date);
                const monthDay = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(
                  dateObj.getDate()
                ).padStart(2, '0')}`;

                return (
                  <li
                    key={post.slug}
                    className="flex items-center gap-4 text-sm group"
                  >
                    <time className="font-mono text-xs text-text-muted/80 w-12 shrink-0">
                      {monthDay}
                    </time>
                    <Link
                      href={post.url}
                      className="font-medium text-text group-hover:text-link transition-colors truncate flex-1"
                    >
                      {post.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
