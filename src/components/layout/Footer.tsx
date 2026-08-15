import React from 'react';
import siteConfig from '../../content/site.json';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const authorName = siteConfig.social?.name || siteConfig.title || 'Author';

  return (
    <footer
      id="footer"
      className="mt-auto py-8 text-center text-xs text-text-muted border-t border-main-border bg-main-bg/50"
    >
      <div className="container mx-auto px-4 max-w-4xl space-y-2">
        <p className="flex items-center justify-center gap-1.5 flex-wrap">
          <span>© {currentYear}</span>
          <span className="font-semibold text-text">{authorName}</span>
          <span>•</span>
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-link underline underline-offset-2 transition-colors"
          >
            Some rights reserved.
          </a>
        </p>

        <p className="text-[11px] text-text-muted/70 flex items-center justify-center gap-1.5 flex-wrap">
          <span>Powered by</span>
          <a
            href="https://rsbuild.dev/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-text-muted hover:text-link transition-colors"
          >
            Rsbuild
          </a>
          <span>&amp;</span>
          <a
            href="https://react.dev/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-text-muted hover:text-link transition-colors"
          >
            React 19
          </a>
          <span>• Theme</span>
          <a
            href="https://github.com/cotes2020/jekyll-theme-chirpy"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-text-muted hover:text-link transition-colors"
          >
            Chirpy
          </a>
        </p>
      </div>
    </footer>
  );
};
