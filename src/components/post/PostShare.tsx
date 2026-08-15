import React, { useState } from 'react';
import { PostItem } from '../../types/content';

interface PostShareProps {
  post: PostItem;
}

export const PostShare: React.FC<PostShareProps> = ({ post }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : post.url;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(post.title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  return (
    <div className="post-tail-wrapper mt-12 pt-6 border-t border-main-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-text-muted">
      {/* License info */}
      <div className="license-wrapper space-y-1">
        <p>
          This post is licensed under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-text hover:text-link underline transition-colors"
          >
            CC BY 4.0
          </a>{' '}
          by the author.
        </p>
      </div>

      {/* Share actions */}
      <div className="share-wrapper flex items-center gap-3">
        <span className="font-semibold text-text uppercase tracking-wider text-[11px]">Share</span>
        <div className="flex items-center gap-2">
          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-sidebar-bg hover:bg-sidebar-hover text-text-muted hover:text-[#1da1f2] border border-main-border transition-all"
            title="Share on Twitter"
            aria-label="Share on Twitter"
          >
            <i className="fa-brands fa-x-twitter text-sm" />
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?title=${encodedTitle}&u=${encodedUrl}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-sidebar-bg hover:bg-sidebar-hover text-text-muted hover:text-[#1877f2] border border-main-border transition-all"
            title="Share on Facebook"
            aria-label="Share on Facebook"
          >
            <i className="fa-brands fa-facebook text-sm" />
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-sidebar-bg hover:bg-sidebar-hover text-text-muted hover:text-[#229ed9] border border-main-border transition-all"
            title="Share on Telegram"
            aria-label="Share on Telegram"
          >
            <i className="fa-brands fa-telegram text-sm" />
          </a>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="relative w-8 h-8 rounded-full flex items-center justify-center bg-sidebar-bg hover:bg-sidebar-hover text-text-muted hover:text-text border border-main-border transition-all"
            title="Copy Link"
            aria-label="Copy Link"
          >
            <i className={copied ? 'fa-solid fa-check text-green-500 text-sm' : 'fa-solid fa-link text-sm'} />
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-heading text-main-bg text-[10px] whitespace-nowrap shadow-md animate-fade-in">
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
